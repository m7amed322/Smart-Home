const jwt = require("jsonwebtoken");
const {User}=require("../models/user");
const {Admin}=require("../models/admin");
const bcrypt = require("bcrypt")
const { date } = require("joi");
module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  const salt=await bcrypt.genSalt(10);
  hToken = await bcrypt.hash(token,salt);
  let user = await User.findOne({jwt:hToken , jwtExpires:{$gt:Date.now()}})
  let admin = await Admin.findOne({jwt:hToken , jwtExpires:{$gt:Date.now()}})
  if(!user || !token || !admin)
  {
    res.status(401).json({error:"accses denied, no token provided or your token is expired"});
  }
  try {
    const payload = jwt.verify(token, process.env.jwtPrivateKey);
    req.tokenPayload = payload;
    next();
  } catch (err) {
    res.status(400).json({error:"not valid token"});
  }
};
