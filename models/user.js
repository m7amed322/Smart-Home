const mongoose = require("mongoose");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const jwt = require("jsonwebtoken");
const crypto = require ("crypto");
const jwtPrivateKey=process.env.jwtPrivateKey
const userSchema = new mongoose.Schema({
  fullName: { type: String, minlength: 3, maxlength: 255, required: true },
  email: {
    type: String,
    minlength: 3,
    maxlength: 255,
    unique: true,
    require: true,
  },
  password: { type: String, required: true },
  home: {
    type: new mongoose.Schema({
      address: {
        type: String,
        minlength: 10,
        maxlength: 255,
        required: true,
      },
      nRooms: { type: Number, min: 0, max: 10, required: true },
    }),
  },
  isAdmin: { type: Boolean, default: false },
  googleId: { type: String, default: null },
  passwordResetToken:String,
  passwordResetTokenExpires:Date,
  passwordChangeAt:Date,
  isActive:{type:Boolean , default:false}
});
userSchema.methods.genToken = function () {
  return jwt.sign(
    { id: this._id, homeId: this.home._id, isAdmin: false },
    jwtPrivateKey
  );
};
userSchema.methods.createResetToken = function (){
  resetToken =crypto.randomBytes(32).toString('hex');
  this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetTokenExpires=Date.now() + 10*60*1000
  return resetToken;
}
const User = mongoose.model("user", userSchema);
exports.User = User;
