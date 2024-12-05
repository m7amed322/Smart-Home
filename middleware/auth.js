const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    res.status(401).json({error:"accses denied, no token provided"});
  }
  try {
    const payload = jwt.verify(token, process.env.jwtPrivateKey);
    req.tokenPayload = payload;
    next();
  } catch (err) {
    res.status(400).json({error:"not valid token"});
  }
};
