const mqtt = require("mqtt");
const mqttServices = require("../Services/mqtt");
const Home = require("../models/home");
const winston = require("winston");
module.exports = async function (io) {
  mqttServices.connect(mqtt);
  setInterval(async () => {
    try {
      await mqttServices.processSeq(io);

      setTimeout(async () => {
        await mqttServices.storeData();
        mqttServices.resetLists();
      }, 22500);
    } catch (err) {
      winston.error("Error in scheduled tasks:", err);
    }
  }, 45000);

};
