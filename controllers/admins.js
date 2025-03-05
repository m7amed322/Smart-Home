const bcrypt = require("bcrypt");
const { Request } = require("../models/request");
const { Home, validate } = require("../models/home");
const { User } = require("../models/user");
const { Admin, validateAdmin } = require("../models/admin");
const crypto = require("crypto");
const _ = require("lodash");
const sendEmail = require("../Utils/emaiil");
const path = require("path");
const { Support } = require("../models/support");
const joi = require("joi");
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
    const { error } = 
    (req.body);
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
      userFullName:request.fullName
    });
    let user = new User({
      fullName: request.fullName,
      email: request.email,
      password: request.email,
      home: _.pick(home, ["address", "householdSize","_id"]),
      userProfilePic:request.profilePic,
      phoneNumber:request.phoneNumber
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    try {
      const templatePath = path.join(__dirname, "../Pages/userInfo.html");
      await sendEmail(
        {
          subject: `Credentials`,
          message: "",
          userEmail: user.email,
          userPassword: user.email,
        },
        templatePath
      );
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
      res.status(400).json(error.details[0].message);
      return;
    }
    let admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      res.status(400).json({ error: "invalid email or password" });
      return;
    }
    const pass = await bcrypt.compare(req.body.password, admin.password);
    if (!pass) {
      res.status(400).json({ error: "invalid email or password" });
      return;
    }
    const token = admin.genToken();
    admin.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await admin.save();
    res.header("x-auth-token", token);
    res.json({ admin: admin, message: "logged in successfully", token: token });
  },
  getHomes: async (req, res, next) => {
    const home = await Home.find();
    res.send(home);
  },
  getSupport:async(req,res,next)=>{
    const support = await Support.find();
    res.send(support);
  },
  getUsers:async(req,res,next)=>{
    const user = await User.find();
    res.send(user);
  },
  replySupport:async(req,res,next)=>{
    const{error}=joi.object({
      message:joi.string().min(3).max(255).required(),
      userId:joi.objectId().required()
    }).validate(req.body);
    if(error){
      res.status(400).json(error.details[0].message);
      return;
    }
    const user=await User.findOne({_id:req.body.userId});
    
    try {
      const templatePath = path.join(__dirname, "../Pages/reply.html");
      await sendEmail(
        {
          subject: `replying your support`,
          message: "",
          reply: req.body.message,
        },
        templatePath
      );
      await Support.deleteOne({'user._id':user._id})
      res.status(200).json({
        status: "successfully",
        message: "email sent with reply",
      });
    } catch (err) {
      return next(err);
    }
  }
  
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
