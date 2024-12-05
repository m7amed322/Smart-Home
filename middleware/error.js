module.exports = function (err, req, res, next) {
  res.status(400).json({erorr_message:err.message});
};
