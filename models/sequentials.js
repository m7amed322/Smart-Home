const { object } = require("joi");
const mongoose = require("mongoose");
const sequentialSchema = new mongoose.Schema({
  occupancy_status: {
    type: String,
    required: true,
    enum: {
      values: ["Occupied", "Unoccupied"],
    },
  },
  number: { type: String, required: true, default: null },
  temperature_setting_C: {
    type: Number,
    min: 2,
    max: 50,
    required: true,
    default: null,
  },
  usage_duration_minutes: {
    type: Number,
    min: 1,
    max: 60,
    required: true,
    default: null,
  },
  appliance: { type: String, required: true },
  home_id: { type: String,required:true},
  device_id:{type:String,required:true}
});
const Sequential = mongoose.model("sequential", sequentialSchema);
exports.Sequential = Sequential;
exports.sequentialSchema = sequentialSchema;
