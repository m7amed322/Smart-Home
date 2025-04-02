const mongoose = require("mongoose");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const alertSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: {
    type: String,
    require: true,
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
});
// function alertValidate(user) {
//   const schema = joi.object({
//     userId: joi.objectId().required(),
//     message: joi.string().required(),
//   });
//   return schema.validate(user);
// }
const Alert = mongoose.model("alert", alertSchema);
exports.Alert=Alert
