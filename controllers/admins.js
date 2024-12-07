const bcrypt = require("bcrypt");
const { Request } = require("../models/request");
const { Home, validate } = require("../models/home");
const {User} = require("../models/user");
const { Admin, validateAdmin } = require("../models/admin");
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
    const { error } = validate(req.body);
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
      nRooms: req.body.nRooms,
    });
    await home.save();
    let user = new User({
      fullName:request.fullName,
      email: request.email,
      password: request.email,
      home: home,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    res.json({
      message: "home & user acc created successfully",
      userEmail: user.email,
      userPassword: user.email,
    });
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
    res.header("x-auth-token", token);
    res.json({ admin:admin
      ,message: "logged in successfully" });
  },
  getHomes: async (req, res, next) => {
    const home = await Home.find();
    res.send(home);
  },
  //   createAdmin:async (req,res)=>{
  //     const {error} = validateAdmin(req.body)
  //     if(error){
  //       res.status(400).json(error.details[0].message)
  //       return;
  //     }
  //     let admin = await Admin.findOne({email:req.body.email});
  //     if(admin){
  //       res.status(400).json("already registered");
  //       return;
  //     }
  //     admin = new Admin({
  //       email:req.body.email,
  //       password:req.body.password
  //     })
  //     const salt =await  bcrypt.genSalt(10);
  //     admin.password = await bcrypt.hash(req.body.password,salt);
  //     await admin.save()
  //     res.json("admin created successfully")
  //   }
};
