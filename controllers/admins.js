const adminValidation = require("../validations/admin.js");
const accountValidation = require("../validations/account.js");
const adminService = require("../Services/admin.js");
const { roomSchema } = require("../models/rooms.js");
module.exports = {
  getRequest: async (req, res, next) => {
    const requests = await adminService.getRequest();
    res.json(requests);
  },
  logIn: async (req, res, next) => {
    const { error } = accountValidation.acc(req.body);
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
    const { error } = adminValidation.support(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const support = await adminService.replySupport(
      req.body.message,
      req.body.supportId
    );
    res.json({
      message: "reply is sent to the user email",
      support: support,
    });
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
    const { error } = accountValidation.email(req.body);
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
    const { error } = adminValidation.home(req.body);
    if (error) {
      return next(error.details[0]);
    }
    if (req.body.rooms.length != req.body.ledNumber.length) {
      return next("there's a room or a leds number missing");
    }
    try {
      const home = await adminService.createHome(req.body);
      res.json({ home });
    } catch (err) {
      next(err);
    }
  },
  createAcc: async (req, res, next) => {
    const { error } = adminValidation.request(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const user = await adminService.createAcc(req.body.requestId);
    res.json({ user, "user email": user.email, "user password": user.email });
  },
  deleteDevice:async(req,res,next)=>{
    const device = await adminService.deleteDevice(req.body.homeId,req.body.name);
    res.json({
      message:"device deleted successfully",
      device
    });
  },
  addDevice:async(req,res,next)=>{
    const device =await adminService.createDevice(req.body.name,req.body.homeId);
    res.json({
      message:`device ${device.name} added successfuly`,
      device
    })
  },
  addRoom:async(req,res,next)=>{
    const room = await adminService.createRoom(req.body.name,req.body.homeId,req.body.ledNumber);
    res.json({
      message:`room ${room.name} added successfuly`,
      room
    })
  },
  deleteRoom:async(req,res,next)=>{
    const room = await adminService.deleteRoom(req.body.homeId,req.body.name);
    res.json({
      message:"room deleted successfully",
      room
    });
  }

  // createAdmin:async (req,res)=>{
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
