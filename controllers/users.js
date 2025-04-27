const mqttService = require("../Services/mqtt.js");
const joi = require("joi");
const { Device } = require("../models/devices.js");
const predict = require("../Services/consumptionPrediction.js");
const { Prediction } = require("../models/predictions.js");
const _ = require("lodash");
const userService = require("../Services/user.js");
module.exports = {
  logIn: async (req, res, next) => {
    const { error } = validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { user, token } = await userService.logIn(
      req.body.email,
      req.body.password
    );
    res.json({ user: user, message: "logged in successfully", token: token });
  },
  getHome: async (req, res, next) => {
    const home = await userService.getHome(
      req.tokenPayload.isAdmin,
      req.tokenPayload.homeId
    );
    res.json(home);
  },
  getMe: async (req, res, next) => {
    const user = await userService.getMe(req.tokenPayload.id);
    res.json(user);
  },
  googleLogIn: async (req, res, next) => {
    const { user, token } = await userService.googleLogIn(req.user);
    res.json({ user: user, message: "logged in successfully", token: token });
  },
  firstTimePassword: async (req, res, next) => {
    const password = await userService.firstTimePassword(
      req.tokenPayload.id,
      req.body.password
    );
    res.json({
      message: "password changed and user is activated successfully",
      password: password,
    });
  },
  forgotPassword: async (req, res, next) => {
    const { error } = joi
      .object({ email: joi.string().email().min(3).max(255).required() })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const resetUrl = await userService.forgotPassword(req.body.email);
    res.json({
      status: "successfully",
      message: "password reset link sent to the user email",
      resetUrl: resetUrl,
    });
  },
  resetPassword: async (req, res, next) => {
    const password = await userService.resetPassword(
      req.params.token,
      req.body.password
    );
    res
      .status(200)
      .json({ message: "password changed successfully", password: password });
  },
  support: async (req, res, next) => {
    const { error } = supportValidate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { user, support } = await userService.support(
      req.body.message,
      req.tokenPayload.id
    );
    res.json({
      user: user,
      message: "message sent to admins successfully",
      support: support,
    });
  },
  logout: async (req, res, next) => {
    const email = await userService.logout(req.tokenPayload.id);
    res.status(200).json({
      message: `user: ${email} logged out`,
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
  createSequence: async (req, res, next) => {
    const { error } = joi
      .object({
        durationInMin: joi.number().min(1).max(60).required(),
        temp: joi.number().min(2).max(50).required(),
        occuped: joi.string().required(),
        deviceName: joi.string().min(3).max(255).required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { seq, device } = await userService.createSequence(
      req.tokenPayload.homeId,
      req.body
    );
    let pred;
    if (device.seqs.length == 12) {
      pred = await userService.handlePrediction(device, predict, req.io);
    }
    res.status(200).json({
      message: "Successfully created sequence",
      sequence: seq,
      pred:pred
    });
  },
  createDevice: async (req, res, next) => {
    const { error } = joi
      .object({
        name: joi.string().min(3).max(255).required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const device = new Device({
      name: req.body.name,
      homeId: req.tokenPayload.homeId,
    });
    await device.save();
    const pred = new Prediction({ device: _.pick(device, ["name", "homeId"]) });
    await pred.save();
    res.json({
      message: "successfully device created",
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
