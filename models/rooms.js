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
  led: {
    number: {
      type: Number,
      min: 1,
      max: 3,
      required: true,
    },
    seqs: {
      type: [sequentialSchema],
      validate: {
        validator: function (array) {
          return array.length === 12;
        },
      },
    },
    preds: predictionSchema,
  },
});
const Room = mongoose.model("room", roomSchema);
exports.Room = Room;
exports.roomSchema = roomSchema;
