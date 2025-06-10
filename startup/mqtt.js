const mqtt = require("mqtt");
const mqttServices = require("../Services/mqtt");
const winston = require("winston")
module.exports = function (io) {
  mqttServices.connect(mqtt);
  setInterval(async () => {
    try {
      await mqttServices.processSeq(io);
      setTimeout(async () => {
        await mqttServices.storeData();
        mqttServices.resetLists();
      }, 45000);
    } catch (err) {
      winston.error("Error in scheduled tasks:", err);
    }
  }, 90000);
};
