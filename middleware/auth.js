const jwt = require("jsonwebtoken");
const {User}=require("../models/user");
const { date } = require("joi");
module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  let user = await User.findOne({jwt:token , jwtExpires:{$gt:Date.now()}})
  if(!user || !token )
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
