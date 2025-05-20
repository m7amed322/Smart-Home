const mongoose = require("mongoose");
const { sequentialSchema } = require("./sequentials");
const { predictionSchema } = require("./predictions");
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 6,
    maxlength: 12,
    required: true,
    enum: {
      values: ["bedroom", "guestroom", "dinningroom", "livingroom", "corridor"],
    },
  },
  led: [
    {
      type: new mongoose.Schema({
        name: {
          type: String,
          required: true,
        },
        seqs: [sequentialSchema],
        preds: predictionSchema,
        energyConsumption: { type: Number },
        energyConsumptionDate: { type: Date },
        state: {
          type: String,
          enum: {
            values: ["on", "off"],
          },
          default: "off",
        },
        stateDate: Date,
      }),
    },
  ],
  homeId: { type: String, required: true },
});
const Room = mongoose.model("room", roomSchema);
exports.Room = Room;
exports.roomSchema = roomSchema;
