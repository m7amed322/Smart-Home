const { string } = require("joi");
const mongoose = require("mongoose");
const predictionSchema = new mongoose.Schema({
  after_1hour: { type: Number, required: true, default: 0 },
  after_2hour: { type: Number, required: true, default: 0 },
  after_3hour: { type: Number, required: true, default: 0 },
  after_4hour: { type: Number, required: true, default: 0 },
  after_5hour: { type: Number, required: true, default: 0 },
  after_6hour: { type: Number, required: true, default: 0 },
  device: {
    type: new mongoose.Schema({
      name: { type: String, minlength: 3, maxlength: 255, required: true },
      homeId: { type: String, required: true },
      id:{ type: String, required: true }
    }),
    required: true,
  },
  roomName:{
    type:String,
    enum: {
      values: ["bedroom", "guestroom", "dinningroom", "livingroom", "corridor"],
    }
  }
});

const Prediction = mongoose.model("prediction", predictionSchema);
exports.Prediction = Prediction;
exports.predictionSchema = predictionSchema;
