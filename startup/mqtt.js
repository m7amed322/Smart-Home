const mqtt = require("mqtt");
const mqttServices = require("../Services/mqtt");
const Home = require("../models/home");
const winston = require("winston");
module.exports = async function (io) {
  mqttServices.connect(mqtt);
  setInterval(async () => {
    try {
      await mqttServices.processSeq(io);
      console.log("creating sequential")
      setTimeout(async () => {
        console.log("storing data and reseting lists")
        await mqttServices.storeData();
        mqttServices.resetLists();
      }, 90000);
    } catch (err) {
      winston.error("Error in scheduled tasks:", err);
    }
  }, 120000);

};
