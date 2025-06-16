const mqtt = require("mqtt");
const mqttServices = require("../Services/mqtt");
const Home = require("../models/home");
const winston = require("winston");
module.exports = async function (io) {
  mqttServices.connect(mqtt);
  setInterval(async () => {
    try {
      await mqttServices.processSeq(io);
        await mqttServices.storeData();
        mqttServices.resetLists();
    } catch (err) {
      winston.error("Error in scheduled tasks:", err);
    }
  }, 120000);
};
