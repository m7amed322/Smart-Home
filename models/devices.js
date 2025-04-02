const mongoose = require("mongoose");
const { sequentialSchema } = require("./sequentials");
const {predictionSchema}=require("./predictions")
const deviceSchema = new mongoose.Schema({
  seqs: {
    type: [sequentialSchema],
    validate: {
      validator: function (array) {
        return array.length === 12;
      },
    },
  },
  name: { type: String, minlength: 3, maxlength: 255, required: true },
  preds: predictionSchema,
});
const Device = mongoose.model("device", deviceSchema);
exports.Device = Device;
exports.deviceSchema = deviceSchema;
