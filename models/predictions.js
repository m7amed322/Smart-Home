const mongoose = require("mongoose");
const predictionSchema = new mongoose.Schema({
  after_1hour: {type:Number,required:true,default:undefined},
  after_2hour:{type:Number,required:true,default:undefined},
  after_3hour: {type:Number,required:true,default:undefined},
  after_4hour:{type:Number,required:true,default:undefined},
  after_5hour:{type:Number,required:true,default:undefined},
  after_6hour:{type:Number,required:true,default:undefined}
});
const Prediction= mongoose.model("prediction", predictionSchema);
exports.Prediction = Prediction;
exports.predictionSchema=predictionSchema;