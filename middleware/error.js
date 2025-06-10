module.exports = function (err, req, res, next) {
  console.log(err.message,err.stack);
  if (err.message == "access denied") {
    res.status(403).json({ error_message: err.message });
    return;
  }
  else if (err.message == "unauthorized") {
    res.status(401).json({ error_message: err.message });
    return;
  }
  else if (new RegExp(".*\\bfound\\b.*", "i").test(err.message)) {
    res.status(404).json({ error_message: err.message });
  }
  else{
    res.status(400).json({ error_message: err.message });
  }
};