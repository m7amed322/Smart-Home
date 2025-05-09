const _ = require("lodash");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const AlertService = require("./alert");
const { User } = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Home  = require("../models/home");
const { wrapper } = require("../utils/helper");
const path = require("path");
const sendEmail = require("./emaiil");
const Support = require("../models/support");
const { Room } = require("../models/rooms");
const userService = {
  createSequence: async (homeId, seqData) => {
    if (new RegExp("^Lighting.?$", "i").test(seqData.deviceName)) {
      try {
        if (!seqData.roomName) {
          throw new Error("roomName is required");
        }
        let deviceNameInSeq = seqData.deviceName;
        deviceNameInSeq = seqData.deviceName.slice(
          0,
          seqData.deviceName.length - 1
        );
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
          throw new Error("device of this home not found ");
        }
        let deviceNameInSeq = seqData.deviceName;
        deviceNameInSeq = seqData.deviceName.slice(
          0,
          seqData.deviceName.length - 1
        );
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
  handlePrediction: async (
    predFun,
    io = null,
    indexOfLed = null,
    room = null,
    device = null
  ) => {
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
          await room.save()
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
          await Home.updateOne({_id:device.homeId,"devices._id":device._id},{$set:{"devices.$.preds":prediction}});
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
  logIn: wrapper(async (email, password) => {
    let user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("invalid email or password");
    }
    const pass = await bcrypt.compare(password, user.password);
    if (!pass) {
      throw new Error("invalid email or password");
    }
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    return { user, token };
  }),
  getHome: wrapper(async (isAdmin, homeId) => {
    if (isAdmin) {
      throw new Error("access denied");
    }
    return await Home.findById(homeId);
  }),
  getMe: wrapper(async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("access denied");
    }
    return user;
  }),
  googleLogIn: wrapper(async (verifiedUser) => {
    if (!verifiedUser) {
      throw new Error("unauthorized");
    }
    let user = await User.findOne({ _id: verifiedUser._id });
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    return { user, token };
  }),
  firstTimePassword: wrapper(async (userId, password) => {
    let user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied"); // because to use this endpoint u must be authenticated so u are admin or user
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordChangeAt = Date.now();
    user.isActive = true;
    await user.save();
    return password;
  }),
  forgotPassword: wrapper(async (email) => {
    let user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("invalid email");
    }
    if (!user.isActive) {
      throw new Error("check your email inbox");
    }
    resetToken = user.createResetToken();
    await user.save();
    const resetUrl = `http://localhost:5173/reset-pass/${resetToken}`;
    try {
      const templatePath = path.join(__dirname, "../Pages//resetPassword.html");
      await sendEmail(
        {
          subject: `resetting password request`,
          resetUrl: resetUrl,
          to: email,
        },
        templatePath
      );
      return resetUrl;
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();
      throw err;
    }
  }),
  resetPassword: wrapper(async (resetToken, password) => {
    const token = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error("not valid token");
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangeAt = Date.now();
    await user.save();
    return password;
  }),
  support: wrapper(async (message, userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied");
    }
    if (await Support.findOne({ "user._id": user._id, responsed: false })) {
      throw new Error(
        "you already sent a support before wait for its responding then you can send a new one"
      );
    }
    const support = new Support({
      user: user,
      message: message,
    });
    await support.save();
    return { user, support };
  }),
  logout: wrapper(async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied");
    }
    user.jwt = undefined;
    user.jwtExpires = undefined;
    await user.save();
    return user.email;
  }),
};
module.exports = userService;
