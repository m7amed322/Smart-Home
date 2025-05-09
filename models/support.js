const {userSchema} =require("./user")
const mongoose = require("mongoose");
const supportSchema = new mongoose.Schema({
    user:{type:userSchema,required:true},
    message:{type:String,min:3,max:255,required:true},
    responsed:{type:Boolean,default:false}
});
const Support = mongoose.model("support", supportSchema);
module.exports = Support;
