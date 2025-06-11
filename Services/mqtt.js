const winston = require("winston");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const Home = require("../models/home");
const _ = require("lodash");
const Support = require("../models/support");
const { Room } = require("../models/rooms");
const Request = require("../models/request");
const { wrapper } = require("../utils/helper");
const {User} = require("../models/user.js");
const predict = require("../utils/consumptionPrediction.js");
const mqttOptions = {
  host: "1ec717a52a884a89956c7ebbcc12e720.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "smartthomee",
  password: "smartt1Homee",
};
let deviceDataList = {};
let TemperatureList = {};
let ledStateList = {};
// Topics
const statusTopic = "+/+/+/status";
const tempTopic = "+/temp";
const dataTopic = "+/+/data";
const mqttServices = {
  mqttClient: null,
  connect(mqtt) {
    this.mqttClient = mqtt.connect(mqttOptions);
    this.mqttClient.on("connect", () => {
      winston.info("✅ Connected to HiveMQ Cloud MQTT Broker");
      this.mqttClient.subscribe([statusTopic, tempTopic, dataTopic], (err) => {
        if (err) {
          winston.error(`❌ Error subscribing: ${err}`);
        } else {
          winston.info("📡 Subscribed to topics");
        }
      });
    });
    ///////////////////////////////////////////
    this.mqttClient.on("message", (topic, message) => {
      const payload = message.toString();
      if (topic.includes("/temp")) {
        const slashIndex = _.indexOf(topic, "/");
        const homeId = topic.slice(0, slashIndex);
        const temperature = parseFloat(payload);
        if (!isNaN(temperature)) {
          TemperatureList[homeId] = temperature;
        }
      } else if (topic.includes("/status")) {
        const parts = topic.split("/");
        const homeId = parts[0];
        const roomName = parts[1];
        const deviceName = parts[2];
        const data = JSON.parse(payload);
        if (!ledStateList[homeId]) {
          ledStateList[homeId] = [];
        }
        let roomEntry = ledStateList[homeId].find(
          (entry) => entry.roomName === roomName
        );
        if (!roomEntry) {
          roomEntry = { roomName, devices: [] };
          ledStateList[homeId].push(roomEntry);
        }
        const deviceEntry = roomEntry.devices.find(
          (d) => d.deviceName === deviceName
        );
        if (!deviceEntry) {
          if (data.state.toLowerCase() === "on") {
            roomEntry.devices.push({ deviceName, status: "on" });
          } else if (data.state.toLowerCase() === "off") {
            const duration = parseFloat(data.duration) / 60;
            const energyConsumption = parseFloat(data.energyConsumption);
            roomEntry.devices.push({
              deviceName,
              status: "off",
              duration,
              energyConsumption,
            });
          }
        } else {
          if (data.state.toLowerCase() === "on") {
            deviceEntry.status = "on";
          } else if (data.state.toLowerCase() === "off") {
            deviceEntry.status = "off";
            const duration = parseFloat(data.duration) / 60;
            const energyConsumption = parseFloat(data.energyConsumption);
            deviceEntry.duration = (deviceEntry.duration || 0) + duration;
            deviceEntry.energyConsumption =
              (deviceEntry.energyConsumption || 0) + energyConsumption;
          }
        }
      } else if (topic.endsWith("/data")) {
        const parts = topic.split("/");
        const homeId = parts[0];
        const deviceName = parts[1];
        const data = JSON.parse(payload);
        const duration = parseFloat(data.duration)/60;
        const energyConsumption = parseFloat(data.energyConsumption);
        if (!deviceDataList[homeId]) {
          deviceDataList[homeId] = [];
        }
        let deviceEntry = deviceDataList[homeId].find(
          (entry) => entry.deviceName === deviceName
        );
        if (!deviceEntry) {
          deviceDataList[homeId].push({
            deviceName,
            data: {
              duration,
              energyConsumption,
            },
          });
        } else {
          deviceEntry.data.duration += duration;
          deviceEntry.data.energyConsumption += energyConsumption;
        }
      }
    });
  },
  checkState(homeId, roomName, led) {
    if (!ledStateList[homeId]) {
      return false;
    }
    const roomEntry = ledStateList[homeId].find(
      (room) => room.roomName === roomName
    );
    if (!roomEntry) {
      return false;
    }
    const deviceEntry = roomEntry.devices.find(
      (device) => device.deviceName === led
    );
    if (!deviceEntry) {
      return false;
    }
    return true;
  },
  async storeData() {
    try {
      if (TemperatureList) {
        for (const homeId in TemperatureList) {
          await Home.updateOne(
            { homeId },
            { $set: { temp: TemperatureList[homeId] } }
          );
        }
      }
      if (ledStateList) {
        for (const homeId in ledStateList) {
          for (const room of ledStateList[homeId]) {
            const roomName = room.roomName;
            for (const device of room.devices) {
              const update = {
                $set: {
                  "led.$.state": device.status,
                  "led.$.energyConsumptionDate": new Date(),
                },
                $inc: {
                  "led.$.energyConsumption": device.energyConsumption || 0,
                  "led.$.usageDurationInMin": device.duration || 0,
                },
              };
              await Room.updateOne(
                { homeId, name: roomName, "led.name": device.deviceName },
                update,
                { upsert: false }
              );
            }
          }
        }
      }
      if (deviceDataList) {
        for (const homeId in deviceDataList) {
          for (const device of deviceDataList[homeId]) {
            const deviceName = device.deviceName;
            const update = {
              $set: {
                energyConsumptionDate: new Date(),
              },
              $inc: {
                energyConsumption: device.data.energyConsumption,
                usageDurationInMin: device.data.duration,
              },
            };
            await Device.updateOne({ homeId, name: deviceName }, update, {
              upsert: false,
            });
          }
        }
      }
    } catch (err) {
      throw err;
    }
  },
  controlLed: async (lightingId, homeId, roomName, state) => {
    if (!lightingId || !homeId || !roomName || !state) {
      throw new Error(
        "Please specify lightingId, homeId, roomName, and state."
      );
    }
    const home = await Home.findOne({
      _id: homeId,
      rooms: {
        $elemMatch: {
          name: roomName,
          "led.name": lightingId,
        },
      },
    });
    if (!home) {
      throw new Error("led not found !");
    }
    const message = state.toUpperCase();
    const topic = `${homeId}/${roomName}/led/${lightingId}`;
    if (!mqttServices.mqttClient.connected) {
      throw new Error("MQTT client not connected");
    }
    await new Promise((resolve, reject) => {
      mqttServices.mqttClient.publish(topic, message, (err) => {
        if (err) reject(new Error("MQTT publish failed"));
        else {
          resolve();
        }
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (mqttServices.checkState(homeId, roomName, lightingId)) {
      await Room.updateOne(
        {
          homeId: homeId,
          name: roomName,
          "led.name": lightingId,
        },
        { $set: { "led.$.state": state } }
      );
      return { message, home };
    } else {
      throw new Error("Mqtt error");
    }
  },
  currentLedsState: wrapper(async (homeId, roomName) => {
    const room = await Room.findOne({ homeId: homeId, name: roomName });
    if (!room) {
      throw new Error("room not found");
    }
    const ledState = room.led.map((led) => ({
      name: led.name,
      state: led.state,
    }));
    return ledState;
  }),
  /////////////////////////////////////////////////////////////////
  async createSequence(homeId, seqData) {
    if (new RegExp("^Lighting.?$", "i").test(seqData.deviceName)) {
      try {
        if (!seqData.roomName) {
          throw new Error("roomName is required");
        }
        let deviceNameInSeq = seqData.deviceName;
        if (/.*\d$/.test(seqData.deviceName)) {
          deviceNameInSeq = seqData.deviceName.slice(
            0,
            seqData.deviceName.length - 1
          );
        }
        const room = await Room.findOne({
          homeId: homeId,
          name: seqData.roomName,
          "led.name": seqData.deviceName,
        });
        if (!room) {
          throw new Error(
            "either room or this led in this room is not found in this home"
          );
        }
        const result = await Room.aggregate([
          {
            $match: {
              name: seqData.roomName,
              homeId: homeId,
            },
          },
          { $unwind: "$led" },
          {
            $match: {
              "led.name": seqData.deviceName,
            },
          },
          {
            $project: {
              ledId: "$led._id",
              _id: 0,
            },
          },
        ]);
        const ledId = result.length > 0 ? result[0].ledId : null;
        if (result.length === 0) {
          throw new Error("No room or LED found");
        }

        const seq = new Sequential({
          home_id: homeId,
          appliance: deviceNameInSeq,
          temperature_setting_C: seqData.temp,
          occupancy_status: seqData.occuped,
          usage_duration_minutes: seqData.durationInMin,
          device_id: ledId,
          roomName: seqData.roomName,
        });
        const seqs = await Sequential.find({
          home_id: homeId,
          device_id: ledId,
          roomName: seqData.roomName,
        });
        if (seqs.length == 0) {
          seq.number = 1;
        } else if (seqs.length > 0 && seqs.length < 12) {
          seq.number = parseInt(seqs[seqs.length - 1].number) + 1;
        } else if (seqs.length == 12) {
          const n = seqs[0].number;
          await Sequential.deleteOne({
            number: n,
            device_id: ledId,
            home_id: homeId,
          });
          await Home.updateOne(
            {
              _id: homeId,
              "rooms.name": seqData.roomName,
              "rooms.led.name": seqData.deviceName,
            },
            {
              $pop: { "rooms.$[room].led.$[led].seqs": -1 },
            },
            {
              arrayFilters: [
                { "room.name": seqData.roomName },
                { "led.name": seqData.deviceName },
              ],
            }
          );
          await Room.updateOne(
            { _id: room._id, "led._id": ledId },
            { $pop: { "led.$.seqs": -1 } }
          );
          seq.number = n;
        }
        await seq.save();
        await Home.updateOne(
          {
            _id: homeId,
            "rooms.name": seqData.roomName,
            "rooms.led.name": seqData.deviceName,
          },
          { $addToSet: { "rooms.$[room].led.$[led].seqs": seq } },
          {
            arrayFilters: [
              { "room.name": seqData.roomName },
              { "led.name": seqData.deviceName },
            ],
          }
        );
        await Room.updateOne(
          { _id: room._id, "led._id": ledId },
          { $addToSet: { "led.$.seqs": seq } }
        );
        const indexOfLed =
          parseInt(seqData.deviceName[seqData.deviceName.length - 1]) - 1;
        return { seq, room, device: null, indexOfLed };
      } catch (err) {
        throw (
          (`failed to create sequence for Lighting in room : ${seqData.roomName} led : ${seqData.deviceName}`,
          err)
        );
      }
    } else {
      try {
        const device = await Device.findOne({
          homeId: homeId,
          name: seqData.deviceName,
        });
        if (!device) {
          console.log(homeId, seqData.deviceName);
          throw new Error("device of this home not found ");
        }
        let deviceNameInSeq = seqData.deviceName;
       if (/.*\d$/.test(seqData.deviceName)) {
          deviceNameInSeq = seqData.deviceName.slice(
            0,
            seqData.deviceName.length - 1
          );
        }
        const seq = new Sequential({
          home_id: homeId,
          appliance: deviceNameInSeq,
          temperature_setting_C: seqData.temp,
          occupancy_status: seqData.occuped,
          usage_duration_minutes: seqData.durationInMin,
          device_id: device._id,
        });
        const seqs = await Sequential.find({
          home_id: homeId,
          device_id: device._id,
        });
        if (seqs.length == 0) {
          seq.number = 1;
        } else if (seqs.length > 0 && seqs.length < 12) {
          seq.number = parseInt(seqs[seqs.length - 1].number) + 1;
        } else if (seqs.length == 12) {
          const n = seqs[0].number;
          await Sequential.deleteOne({
            number: n,
            device_id: device._id,
            home_id: homeId,
          });
          seq.number = n;
        }
        await seq.save();
        device.seqs = await Sequential.find({
          home_id: homeId,
          device_id: device._id,
        });
        await device.save();
        await Home.updateOne(
          { _id: homeId, "devices.name": seqData.deviceName },
          { $addToSet: { "devices.$.seqs": seq } }
        );
        return { seq, room: null, device, indexOfLed: null };
      } catch (err) {
        throw ("failed of creating a sequential document: ", err);
      }
    }
  },
  async handlePrediction(
    predFun,
    io = null,
    indexOfLed = null,
    room = null,
    device = null
  ) {
    if (room) {
      try {
        let indexOfled = parseInt(indexOfLed);
        if (room.led[indexOfled].seqs.length == 12) {
          const predValue = predFun(
            _.map(room.led[indexOfled].seqs, (obj) =>
              _.pick(obj, [
                "occupancy_status",
                "temperature_setting_C",
                "usage_duration_minutes",
                "appliance",
                "home_id",
              ])
            )
          );
          const prediction = await Prediction.findOne({
            "device.name": room.led[indexOfled].name,
            "device.homeId": room.homeId,
            "device.id": room.led[indexOfled]._id,
            roomName: room.name,
          });
          prediction.after_1hour = prediction.after_2hour;
          prediction.after_2hour = prediction.after_3hour;
          prediction.after_3hour = prediction.after_4hour;
          prediction.after_4hour = prediction.after_5hour;
          prediction.after_5hour = prediction.after_6hour;
          prediction.after_6hour = predValue;
          await prediction.save();
          await Home.updateOne(
            {
              _id: room.homeId,
              "rooms.name": room.name,
              "rooms.led.name": room.led[indexOfled].name,
            },
            { $set: { "rooms.$[room].led.$[led].preds": prediction } },
            {
              arrayFilters: [
                { "room.name": room.name },
                { "led.name": room.led[indexOfled].name },
              ],
            }
          );
          room.led[indexOfLed].preds = prediction;
          await room.save();
          const user = await User.findOne({ "home._id": room.homeId });
          let alert;
          if (predValue > 50) {
            alert = await AlertService.createAlert(
              user._id,
              `from the device: ${room.led[indexOfled].name} of room : ${room.name} the predicted value after 6 hours: ${predValue} `,
              io
            );
          }
          return { prediction, alert };
        }
        return { prediction: null, alert: null };
      } catch (err) {
        throw err;
      }
    } else if (device) {
      try {
        if (device.seqs.length == 12) {
          // rather predFun as a parameter it will be the axios function that call the api
          const predValue = predFun(
            _.map(device.seqs, (obj) =>
              _.pick(obj, [
                "occupancy_status",
                "temperature_setting_C",
                "usage_duration_minutes",
                "appliance",
                "home_id",
              ])
            )
          );
          const prediction = await Prediction.findOne({
            "device.name": device.name,
            "device.homeId": device.homeId,
            "device.id": device._id,
          });
          prediction.after_1hour = prediction.after_2hour;
          prediction.after_2hour = prediction.after_3hour;
          prediction.after_3hour = prediction.after_4hour;
          prediction.after_4hour = prediction.after_5hour;
          prediction.after_5hour = prediction.after_6hour;
          prediction.after_6hour = predValue;
          await prediction.save();
          device.preds = await Prediction.findOne({
            "device.name": device.name,
            "device.homeId": device.homeId,
            "device.id": device._id,
          });
          await device.save();
          await Home.updateOne(
            { _id: device.homeId, "devices._id": device._id },
            { $set: { "devices.$.preds": prediction } }
          );
          const user = await User.findOne({ "home._id": device.homeId });
          let alert;
          if (predValue > 50) {
            alert = await AlertService.createAlert(
              user._id,
              `from the device: ${device.name} the predicted value after 6 hours: ${predValue} `,
              io
            );
          }
          return { prediction, alert };
        }
        return { prediction: null, alert: null };
      } catch (err) {
        throw err;
      }
    }
  },
  async processSeq(io) {
    if (deviceDataList) {
      for (const homeId in deviceDataList) {
        for (const devicee of deviceDataList[homeId]) {
          const deviceName = devicee.deviceName;
          const seqData = {
            occuped: "Occupied",
            temp: TemperatureList[homeId],
            durationInMin: devicee.data.duration,
            deviceName: deviceName,
          };
          const { seq, room, device, indexOfLed } =
            await mqttServices.createSequence(homeId, seqData);
          await mqttServices.handlePrediction(predict, io, null, null, device);
        }
      }
    }
    if (ledStateList) {
      for (const homeId in ledStateList) {
        for (const room of ledStateList[homeId]) {
          const roomName = room.roomName;
          for (const devicee of room.devices) {
            if (devicee.status === "off") {
              const seqData = {
                occuped: "Occupied",
                temp: TemperatureList[homeId],
                durationInMin: devicee.duration,
                deviceName: devicee.deviceName,
                roomName: roomName,
              };
              const { seq, room, device, indexOfLed } =
                await mqttServices.createSequence(homeId, seqData);
              await mqttServices.handlePrediction(
                predict,
                io,
                indexOfLed,
                room,
                null
              );
            }
          }
        }
      }
    }
  },
  resetLists() {
    deviceDataList = {};
    TemperatureList = {};
    ledStateList = {};
  },
};
module.exports = mqttServices;
