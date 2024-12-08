const mongoose = require("mongoose");
const joi = require("joi");
const complexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");
const jwtPrivateKey=process.env.jwtPrivateKey
// require("dotenv").config();
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    minlength: 3,
    maxlength: 255,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
  jwt:String,
  jwtExpires:Date
});
adminSchema.methods.genToken = function () {
  token= jwt.sign(
    { id: this._id, email: this.email, isAdmin: true },
    jwtPrivateKey
  );
  this.jwtExpires = Date.now()+60*1000*60*24*10;
  return token;
};
const Admin = mongoose.model("admin", adminSchema);

function validateAdmin(admin, pass) {
  const schema = joi.object({
    email: joi.string().email().min(3).max(255).required(),
    password: joi.string().required(),
  });
  const complexityOptions = {
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
  };
  return schema.validate(admin), complexity(complexityOptions).validate(pass);
}

exports.Admin = Admin;
exports.validateAdmin = validateAdmin;
