const mqtt = require("mqtt");
const { Home } = require("../models/home");
class MqttService {
  constructor() {
    this.options = {
      host: process.env.MQTThost,
      port: process.env.MQTTport,
      protocol: "mqtts",
      username: process.env.MQTTusername,
      password: process.env.MQTTpassword,
    };

    this.statusTopic = "+/+/+/status";
    this.tempTopic = "+/temp";
    this.client = mqtt.connect(this.options);
    this.initializeMqtt();
  }

  initializeMqtt() {
    this.client.on("connect", () => {
      this.client.subscribe(this.statusTopic, (err) => {});
      this.client.subscribe(this.tempTopic, (err) => {});
    });

    this.client.on("message", async (topic, message) => {
      homeId = getHomeId(topic);
      const home = await Home.findOne({ _id: homeId });
      home.temp = message.toString();
      home.save();
    });
  }

  controlLed(homeId, roomName, state, ledNumber) {
    return new Promise((resolve, reject) => {
      const validRooms = [
        "bedroom",
        "guestroom",
        "dinningroom",
        "livingroom",
        "corridor",
      ];

      if (!["on", "off"].includes(state)) {
        reject(new Error("Invalid state. Use 'on' or 'off'."));
        return;
      }

      if (!validRooms.includes(roomName)) {
        reject(new Error("Invalid room name"));
        return;
      }

      const topic = `${homeId}/${roomName}/led/${ledNumber}`;
      const message = state.toUpperCase();

      this.client.publish(topic, message, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`LED turned ${state}`);
        }
      });
    });
  }
}
function getHomeId(topic) {
  slashIndex = topic.indexOf("/");
  homeId = topic.slice(0, slashIndex);
  return homeId;
}

module.exports = new MqttService();
