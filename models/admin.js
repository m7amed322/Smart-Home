const mongoose = require("mongoose");
const joi = require("joi");
const complexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const jwtPrivateKey = process.env.jwtPrivateKey;
// require("dotenv").config();
const adminSchema = new mongoose.Schema({
  fullName: { type: String, minlength: 3, maxlength: 255, required: true },
  email: {
    type: String,
    minlength: 3,
    maxlength: 255,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true },
  jwt: String,
  jwtExpires: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  passwordChangeAt: Date,
});
adminSchema.methods.genToken = function () {
  token = jwt.sign(
    { id: this._id, email: this.email, isAdmin: true },
    jwtPrivateKey
  );
  this.jwtExpires = Date.now() + 60 * 1000 * 60 * 24 * 10;
  return token;
};
adminSchema.methods.createResetToken = function () {
  resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

function validateAdmin(admin) {
  const schema = joi.object({
    email: joi.string().email().min(3).max(255).required(),
    password: joi.string().required(),
  });
  return schema.validate(admin);
}

const Admin = mongoose.model("admin", adminSchema);
exports.Admin = Admin;
exports.validateAdmin = validateAdmin;
