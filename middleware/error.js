module.exports = function (err, req, res, next) {
  console.log(err.message);
  if(err.message=="access denied"){
    res.status(403).json({erorr_message:err.message});
    return;
  }
  if(err.message=="unauthorized"){
    res.status(401).json({erorr_message:err.message});
    return;
  }
  res.status(400).json({erorr_message:err.message});
};
