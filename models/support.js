const {userSchema} =require("./user")
const mongoose = require("mongoose");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const supportSchema = new mongoose.Schema({
    user:{type:userSchema,required:true},
    message:{type:String,min:3,max:255,required:true},
    responsed:{type:Boolean,default:false}
});
const Support = mongoose.model("support", supportSchema);
function supportValidate(support) {
  const schema = joi.object({
    message: joi.string().min(3).max(255).required(),
  });
  return schema.validate(support);
}
exports.Support = Support;
exports.supportValidate = supportValidate;
