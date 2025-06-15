const mongoose = require("mongoose");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const { deviceSchema } = require("./devices");
const { roomSchema } = require("./rooms");
const homeSchema = new mongoose.Schema({
  address: { type: String, minlength: 10, maxlength: 255 },
  userEmail: { type: String, minlength: 3, maxlength: 255, unique: true },
  userFullName: { type: String, minlength: 3, maxlength: 255, required: true },
  householdSize: { type: Number, min: 0, max: 10, required: true },
  devices: { type: [deviceSchema], required: true },
  rooms: { type: [roomSchema], required: true },
  temp: { type: Number },
  totalEnergyConsumption: { type: Number },
  totalEnergyConsumptionDate: { type: Date },
  monthlyDate: { type: Date, default: new Date() },
  monthlySummary: { type: Object, default: null },
  weeklyDate: { type: Date, default: new Date() },
  weeklySummary: { type: Object, default: new Date() },
});

const Home = mongoose.model("home", homeSchema);
module.exports = Home;
