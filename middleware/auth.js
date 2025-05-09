const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const Admin = require("../models/admin");
// require("dotenv").config();
const crypto = require("crypto");
const { error } = require("console");
module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    res.status(401).json({ error: "accses denied, no token provided " });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.jwtPrivateKey);
  } catch (err) {
    next(err);
  }
  let payload = jwt.verify(token, process.env.jwtPrivateKey);

  if (payload.isAdmin) {
    let admin = await Admin.findOne({ _id: payload.id });
    hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (admin.jwt != hashedToken || admin.jwtExpires < Date.now()) {
      res.status(401).json({error:"not valid token or token is expired"});
      return;
    }
    req.tokenPayload = payload;
    next();
  } else {
    let user = await User.findOne({ _id: payload.id });
    hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (user.jwt != hashedToken || user.jwtExpires < Date.now()) {
      res.status(401).json({error:"not valid token or token is expired"});
      return;
    }
    req.tokenPayload = payload;
    next();
  }
};
