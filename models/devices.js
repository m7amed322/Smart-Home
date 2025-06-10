const mongoose = require("mongoose");
const { predictionSchema } = require("./predictions");
const { sequentialSchema } = require("./sequentials");
const { values } = require("lodash");
const deviceSchema = new mongoose.Schema({
  seqs: {
    type: [sequentialSchema],
  },
  name: {
    type: String,
    minlength: 3,
    maxlength: 255,
    required: true,
    validate: {
      validator: function (value) {
        return /^((Dishwasher)|(Electronics)|(HVAC)|(Refrigerator)|(Washing Machine))\d*$/.test(
          value
        );
      },
      message: "Name must be one of {values} optionally followed by a number",
    },
  },
  preds: predictionSchema,
  homeId: { type: String, required: true },
  energyConsumption: { type: Number,default:0,min:0 },
  energyConsumptionDate: { type: Date },
  usageDurationInMin:{type:Number,default:0,min:0}
});
const Device = mongoose.model("device", deviceSchema);
exports.Device = Device;
exports.deviceSchema = deviceSchema;
