const mongoose = require("mongoose");
const sequentialSchema = new mongoose.Schema({
  occuped: {type:Boolean , required:true ,default:undefined},
  number:{ type: String, required: true ,default:undefined},
  temp: {type:Number,min:2,max:50,required:true,default:undefined},
  durationInMin:{type:Number,min:1,max:60,required:true,default:undefined},
});
const Sequential= mongoose.model("sequential", sequentialSchema);
exports.Sequential = Sequential;
exports.sequentialSchema=sequentialSchema;