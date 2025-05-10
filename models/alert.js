const mongoose = require("mongoose");
const alertSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: {
    type: String,
    require: true,
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: new Date() },
});

const Alert = mongoose.model("alert", alertSchema);
exports.Alert=Alert
