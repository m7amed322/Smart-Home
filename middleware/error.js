module.exports = function (err, req, res, next) {
  console.log(err);
  res.status(400).json({erorr_message:err.message});
};
