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
    const requests = await adminService.getRequest();
    res.json(requests);
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
  getHome: async (req, res, next) => {
    const home = await adminService.getHomes();
    res.json({ homes: home });
  },
  getSupport: async (req, res, next) => {
    const support = await adminService.getSupports();
    res.json({ supports: support });
  },
  getUser: async (req, res, next) => {
    const user = await adminService.getUsers();
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
    const support = await adminService.replySupport(req.body.message,req.body.supportId);
    res.json({
      message:"reply is sent to the user email",
      support:support
    })
  },
  getHomeById: async (req, res, next) => {
    const home = await adminService.getHomeById(req.params.id);
    res.json({ home: home });
  },
  getSupportById: async (req, res, next) => {
    const support = await adminService.getSupportById(req.params.id);
    res.json({ support: support });
  },
  getUserById: async (req, res, next) => {
    const user = await adminService.getUserById(req.params.id);
    res.json({ user: user });
  },
  getRequestById: async (req, res, next) => {
    const request = await adminService.getRequestById(req.params.id);
    res.json({ request: request });
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
  resetPassword: async (req, res, next) => {
    const password = await adminService.resetPassword(
      req.params.token,
      req.body.password
    );
    res
      .status(200)
      .json({ message: "password changed successfully", password: password });
  },
  getMe: async (req, res, next) => {
    const admin = await adminService.getMe(req.tokenPayload.id);
    res.json({
      admin: admin,
    });
  },
  createHome: async (req, res, next) => {
    const { error } = joi
      .object({
        requestId: joi.objectId().required(),
        ledNumber: joi.array().required(),
        rooms: joi.array().required(),
        devices: joi.array().required(),
        householdSize: joi.number().required(),
      })
      .validate(req.body);
    if (error) {
      return next(error.details[0]);
    }
    if (req.body.rooms.length != req.body.ledNumber.length) {
      return next("there's a room or a leds number missing");
    }
    try {
      const home = await adminService.createHome(req.body);
      res.json({
        home: {
          id: home._id,
          address: home.address,
          userFullName: home.userFullName,
          userEmail: home.userEmail,
          householdSize: home.householdSize,
          devices: home.devices,
          rooms: home.rooms,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  createAcc: async (req, res, next) => {
    const { error } = joi
      .object({
        requestId: joi.objectId().required(),
      })
      .validate(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const user = await adminService.createAcc(
      req.body.requestId
    );
    res.json({ user, "user email": user.email, "user password": user.email });
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
