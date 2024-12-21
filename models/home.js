const mongoose = require("mongoose");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const homeSchema = new mongoose.Schema({
  address: { type: String, minlength: 10, maxlength: 255 },
  userEmail: { type: String, minlength: 3, maxlength: 255, unique: true },
  userFullName:{ type: String, minlength: 3, maxlength: 255, required: true },
  householdSize: { type: Number, min: 0, max: 10, required: true },
});
const Home = mongoose.model("home", homeSchema);
function validate(home) {
  const schema = joi.object({
    requestId: joi.objectId().required(),
    householdSize: joi.number().min(0).max(10).required(),
  });
  return schema.validate(home);
}
exports.Home = Home;
exports.validate = validate;
