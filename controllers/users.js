const { User } = require("../models/user");
const mqttService = require("../Utils/mqtt.js");
const bcrypt = require("bcrypt");
const joi = require("joi");
const { Home } = require("../models/home");
const sendEmail = require("../Utils/emaiil");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { Support, supportValidate } = require("../models/support.js");
module.exports = {
  logIn: async (req, res, next) => {
    const { error } = validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({ error: "invalid email or password" });
      return;
    }
    const pass = await bcrypt.compare(req.body.password, user.password);
    if (!pass) {
      res.status(400).json({ error: "invalid email or password" });
      return;
    }
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    res.header("x-auth-token", token);
    res.json({ user: user, message: "logged in successfully", token: token });
  },
  getHome: async (req, res, next) => {
    if (req.tokenPayload.isAdmin) {
      res.status(403).json({ error: "accsess denied" });
      return;
    }
    const home = await Home.findById(req.tokenPayload.homeId);
    res.json(home);
  },
  getMe: async (req, res, next) => {
    if (req.tokenPayload.isAdmin) {
      res.status(403).json({ error: "accsess denied" });
      return;
    }
    const user = await User.findById(req.tokenPayload.id);
    res.json(user);
  },
  googleLogIn: async (req, res, next) => {
    if (!req.user) {
      res.status(400).json({ error: "unauthorized" });
      return;
    }
    let user = new User(req.user);
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    res
      .status(200)
      .header("x-auth-token", token)
      .json({ user: user, message: "logged in successfully", token: token });
  },
  forgotPassword: async (req, res, next) => {
    const { error } = joi
      .object({ email: joi.string().email().min(3).max(255).required() })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({ error: "invalid email" });
      return;
    }
    if (!user.isActive) {
      res.status(400).json({ error: "check your email inbox" });
      return;
    }
    resetToken = user.createResetToken();
    await user.save();
    // resetUrl=`${req.protocol}://${req.get('host')}/api/users/reset/${resetToken}`
    resetUrl = `http://localhost:5173/reset-pass/${resetToken}`;
    // const message = `we have recieved a password reset request. please use the below link to reset your password
    // \n
    // ${resetUrl}\n\n this is reset password link will be valid only for 10 mins.
    // `;
    try {
      const templatePath = path.join(__dirname, "../Pages/resetPassword.html");
      await sendEmail(
        {
          subject: `resetting password request`,
          resetUrl: resetUrl,
          to: req.body.email,
        },
        templatePath
      );

      res.status(200).json({
        status: "successfully",
        message: "password reset link sent to the user email",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();
      return next(err);
    }
  },
  resetPassword: async (req, res, next) => {
    const token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      res.status(400).json("not valid token");
      return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangeAt = Date.now();
    await user.save();
    res.status(200).json({ message: "password changed successfully" });
  },
  settingPassword: async (req, res, next) => {
    if (!req.tokenPayload.id) {
      res.status(403).json({ error: "accsess denied" });
      return;
    }
    if (req.tokenPayload.isAdmin) {
      res.status(403).json({ error: "access denied for admin" });
      return;
    }
    let user = await User.findOne({ _id: req.tokenPayload.id });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.passwordChangeAt = Date.now();
    user.isActive = true;
    await user.save();
    res.json({
      message: "password changed and user is activated successfully",
    });
  },
  support: async (req, res, next) => {
    const { error } = supportValidate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const user = await User.findOne({ _id: req.tokenPayload.id });
    if (await Support.findOne({ "user._id": user._id, responsed: false })) {
      res
        .status(400)
        .json(
          "you already sent a support before wait for its responding then you can send a new one"
        );
      return;
    }
    const schema = new Support({
      user: user,
      message: req.body.message,
    });
    await schema.save();
    res.json({ user: user, message: "message sent to admins successfully" });
  },
  logout: async (req, res, next) => {
    const user = await User.findOne({ _id: req.tokenPayload.id });
    user.jwt = undefined;
    user.jwtExpires = undefined;
    await user.save();
    res.status(200).json({
      message: `user: ${user.email} logged out`,
    });
  },
  controlLed: async (req, res, next) => {
    const { roomName, state, ledNumber } = req.body;
    if (!roomName || !state || !ledNumber) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: roomName, state, or ledNumber",
      });
      return;
    }
    const result = await mqttService.controlLed(
      req.tokenPayload.homeId,
      roomName,
      state,
      ledNumber
    );
    res.json({
      success: true,
      message: result,
    });
  },
};
function validate(user) {
  const schema = joi.object({
    email: joi.string().email().min(3).max(255).required(),
    password: joi.string().required(),
  });
  return schema.validate(user);
}
