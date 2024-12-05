module.exports = function (req, res, next) {
  if (!req.tokenPayload.isAdmin) {
    res.status(403).json("access denied");
    return;
  }
  next();
};
