const mongoose = require("mongoose");
const joi = require("joi");
const requestSchema = new mongoose.Schema({
  fullName: { type: String, minlength: 3, maxlength: 255, required: true },
  email: {
    type: String,
    minlength: 3,
    maxlength: 255,
    required: true,
    unique: true,
  },
  phoneNumber: { type: String, minlength: 5, maxlength: 15, required: true },
  homeAddress: { type: String, minlength: 10, maxlength: 255, required: true },
  profilePic: String,
  accCreated:{type:Boolean,default:false},
  homeCreated:{type:Boolean,default:false}
});
const Request = mongoose.model("request", requestSchema);
module.exports = Request;
