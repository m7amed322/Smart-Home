const jwt = require("jsonwebtoken");
const {User}=require("../models/user");
const {Admin}=require("../models/admin");
// require("dotenv").config();
const bcrypt = require("bcrypt")
const { date } = require("joi");
module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  if( !token )
  {
    res.status(401).json({error:"accses denied, no token provided "});
  }
  try {
    const payload = jwt.verify(token, process.env.jwtPrivateKey);
  } catch (err) {
    res.status(400).json({error:"not valid token"});
  }
    let payload = jwt.verify(token, process.env.jwtPrivateKey);
    let user = await User.findOne({_id:payload.id})
    let admin = await Admin.findOne({_id:payload.id})
    if(payload.isAdmin){
      hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      if(admin.jwt!=hashedToken || admin.jwtExpires<Date.now()){
        res.status(401).json({error:"not valid token or token is expired"});
      }
      req.tokenPayload = payload;
      next();
    }
    else{
    hashedToken=crypto.createHash('sha256').update(token).digest('hex');
    if(user.jwt!=hashedToken||user.jwtExpires<Date.now()){
      res.status(401).json({error:"not valid token or token is expired"});
    }
    req.tokenPayload = payload;
      next();
  }
};
