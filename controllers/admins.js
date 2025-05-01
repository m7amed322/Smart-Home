const bcrypt = require("bcrypt");
const { Request } = require("../models/request");
const { Home, validate } = require("../models/home");
const { User } = require("../models/user");
const { Admin, validateAdmin } = require("../models/admin");
const crypto = require("crypto");
const _ = require("lodash");
const sendEmail = require("../Services/emaiil");
const path = require("path");
const { Support } = require("../models/support.js");
const joi = require("joi");
const adminService = require("../Services/admin.js");
const { resetPassword } = require("./users.js");
joi.objectId = require("joi-objectid")(joi);
module.exports = {
  getRequest: async (req, res, next) => {
    const request = await Request.find();
    if (request.length === 0) {
      res.status(404).json({ error: "no requests founded" });
      return;
    }
    res.json(request);
  },
  createHomeAndAcc: async (req, res, next) => {
    const { error } = req.body;
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const request = await Request.findById(req.body.requestId);
    if (!request) {
      res.status(404).json({ error: "wrong request ID" });
      return;
    }
    const home = new Home({
      address: request.homeAddress,
      userEmail: request.email,
      householdSize: req.body.householdSize,
      userFullName: request.fullName,
    });
    let user = new User({
      fullName: request.fullName,
      email: request.email,
      password: request.email,
      home: _.pick(home, ["address", "householdSize", "_id"]),
      userProfilePic: request.profilePic,
      phoneNumber: request.phoneNumber,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    try {
      const templatePath = path.join(__dirname, "../Pages/userInfo.html");
      await sendEmail(
        {
          subject: `Credentials`,
          userEmail: user.email,
          userPassword: user.email,
          to: user.email,
        },
        templatePath
      );
      request.read = true;
      await request.save();
      await home.save();
      await user.save();

      res.status(200).json({
        status: "successfully",
        message:
          "the credentials mail sent to the user email ,home & user acc created successfully",
        userEmail: user.email,
        userPassword: user.email,
      });
    } catch (err) {
      return next(err);
    }
  },
  logIn: async (req, res, next) => {
    const { error } = validateAdmin(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const { admin, token } = await adminService.logIn(
      req.body.email,
      req.body.password
    );
    res.header("x-auth-token", token);
    res.json({ admin: admin, message: "logged in successfully", token: token });
  },
  logout: async (req, res, next) => {
    const email = await adminService.logout(req.tokenPayload.id);
    res.status(200).json({
      message: `admin: ${email} is logged out`,
    });
  },
  getHomes: async (req, res, next) => {
    const home = await Home.find();
    res.json({ homes: home });
  },
  getSupport: async (req, res, next) => {
    const support = await Support.find();
    res.json({ supports: support });
  },
  getUsers: async (req, res, next) => {
    const user = await User.find();
    res.json({ users: user });
  },
  replySupport: async (req, res, next) => {
    const { error } = joi
      .object({
        message: joi.string().min(3).max(255).required(),
        supportId: joi.objectId().required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const support = await Support.findOne({ _id: req.body.supportId });

    try {
      const templatePath = path.join(__dirname, "../Pages/supportEmail.html");
      await sendEmail(
        {
          subject: `replying your support`,
          reply: req.body.message,
          to: support.user.email,
        },
        templatePath
      );
      support.responsed = true;
      await support.save();
      res.status(200).json({
        status: "successfully",
        message: "email sent with reply",
      });
    } catch (err) {
      return next(err);
    }
  },
  getHomesById: async (req, res, next) => {
    const home = await Home.findOne({ _id: req.params.id });
    res.json({ home: home });
  },
  getSupportById: async (req, res, next) => {
    const support = await Support.findOne({ _id: req.params.id });
    res.json({ support: support });
  },
  getUsersById: async (req, res, next) => {
    const user = await User.findOne({ _id: req.params.id });
    res.json({ user: user });
  },
  getRequestById: async (req, res, next) => {
    const request = await Request.findOne({ _id: req.params.id });
    res.json({ request: request });
  },
  deleteUserAndHome: async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    const home = await Home.findOneAndDelete({ userEmail: user.email });
    const support = await Support.findOneAndDelete({ "user._id": user._id });
    const request = await Request.findOneAndDelete({ email: user.email });
    if (!user) {
      res.status(404).json("user not found");
      return;
    }
    res.status(200).json({
      message: `user: ${user.email} and his home is deleted`,
    });
  },
  forgotPassword: async (req, res, next) => {
    const { error } = joi
      .object({ email: joi.string().email().min(3).max(255).required() })
      .validate(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const resetUrl = await adminService.forgotPassword(req.body.email);
    res.json({
      status: "successfully",
      message: "password reset link sent to the admin email",
      resetUrl: resetUrl,
    });
  },
  resetPassword:async(req,res,next)=>{
    const password = await adminService.resetPassword(
      req.params.token,
      req.body.password
    );
    res
      .status(200)
      .json({ message: "password changed successfully", password: password });
  },
  // createAdmin:async (req,res)=>{
  //   const {error} = validateAdmin(req.body)
  //   if(error){
  //     res.status(400).json(error.details[0].message)
  //     return;
  //   }
  //   let admin = await Admin.findOne({email:req.body.email});
  //   if(admin){
  //     res.status(400).json("already registered");
  //     return;
  //   }
  //   admin = new Admin({
  //     fullName:req.body.fullName,
  //     email:req.body.email,
  //     password:req.body.password
  //   })
  //   const salt =await  bcrypt.genSalt(10);
  //   admin.password = await bcrypt.hash(req.body.password,salt);
  //   await admin.save()
  //   res.json("admin created successfully")
  // }
};
