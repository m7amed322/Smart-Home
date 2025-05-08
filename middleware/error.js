module.exports = function (err, req, res, next) {
  console.log({
    message: err.message,
    stack: err.stack,
  });
  if (err.message == "access denied") {
    res.status(403).json({ erorr_message: err.message });
    return;
  }
  if (err.message == "unauthorized") {
    res.status(401).json({ erorr_message: err.message });
    return;
  }
  if (new RegExp(".*\\bfound\\b.*", "i").test(err.message)) {
    res.status(404).json({ erorr_message: err.message });
  }
  res.status(400).json({ erorr_message: err.message });
};
