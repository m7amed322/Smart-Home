const statusTopic = "+/+/+/status";
const tempTopic = "+/temp";
const options = {
    host: process.env.MQTThost,
    port: process.env.MQTTport,
    protocol: "mqtts",
    username: process.env.MQTTusername,
    password: process.env.MQTTpassword,
  };
const mqttClient = mqtt.connect(options);
mqttClient.on("connect", () => {
    console.log("Connected to HiveMQ Cloud MQTT Broker");
    
    mqttClient.subscribe(statusTopic, (err) => {
      if (err) {
        console.log(`Not subscribed: ${err}`);
      }
    });
    mqttClient.subscribe(tempTopic, (err) => {
      if (err) {
        console.log(`Not subscribed: ${err}`);
      }
    });
});
mqttClient.on("message", (topic, message) => {
    console.log(`From topic ${topic}: ${message.toString()}`);
  });
  app.post("/control", (req, res) => {
    const obj = req.body;
    if (obj.state === "on" || obj.state === "off") {
      const validRooms = ["bedroom", "guestroom", "dinningroom", "livingroom", "corridor"];
      if (!validRooms.includes(obj.roomName) && obj.ledNumber !== 1) {
        return res.status(400).json({ success: false, message: "Invalid room or LED number" });
      }
      mqttClient.publish(`${obj.homeId}/${obj.roomName}/led/1`, obj.state.toUpperCase());
      return res.json({ success: true, message: `LED turned ${obj.state}` });
    } else {
      return res.status(400).json({ success: false, message: "Invalid state. Use 'on' or 'off'." });
    }
  });
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });