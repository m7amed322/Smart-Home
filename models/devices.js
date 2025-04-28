const mongoose = require("mongoose");
const {predictionSchema}=require("./predictions")
const {sequentialSchema} = require("./sequentials");
const deviceSchema = new mongoose.Schema({
  seqs: {
    type: [sequentialSchema]
  },
  name: { type: String, minlength: 3, maxlength: 255, required: true },
  preds: predictionSchema,
  homeId:{type:String, required:true }
});
const Device = mongoose.model("device", deviceSchema);
exports.Device = Device;
exports.deviceSchema = deviceSchema;
