const mqttService = require("../Services/mqtt.js");
const joi = require("joi");
const { Device } = require("../models/devices.js");
const predict = require("../Services/consumptionPrediction.js");
const { Prediction } = require("../models/predictions.js");
const _ = require("lodash");
const userService = require("../Services/user.js");
const { Home } = require("../models/home.js");
const { Sequential } = require("../models/sequentials.js");
module.exports = {
  logIn: async (req, res, next) => {
    const { error } = validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { user, token } = await userService.logIn(
      req.body.email,
      req.body.password
    );
    res.json({ user: user, message: "logged in successfully", token: token });
  },
  getHome: async (req, res, next) => {
    const home = await userService.getHome(
      req.tokenPayload.isAdmin,
      req.tokenPayload.homeId
    );
    res.json(home);
  },
  getMe: async (req, res, next) => {
    const user = await userService.getMe(req.tokenPayload.id);
    res.json(user);
  },
  googleLogIn: async (req, res, next) => {
    const { user, token } = await userService.googleLogIn(req.user);
    res.json({ user: user, message: "logged in successfully", token: token });
  },
  firstTimePassword: async (req, res, next) => {
    const password = await userService.firstTimePassword(
      req.tokenPayload.id,
      req.body.password
    );
    res.json({
      message: "password changed and user is activated successfully",
      password: password,
    });
  },
  forgotPassword: async (req, res, next) => {
    const { error } = joi
      .object({ email: joi.string().email().min(3).max(255).required() })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const resetUrl = await userService.forgotPassword(req.body.email);
    res.json({
      status: "successfully",
      message: "password reset link sent to the user email",
      resetUrl: resetUrl,
    });
  },
  resetPassword: async (req, res, next) => {
    const password = await userService.resetPassword(
      req.params.token,
      req.body.password
    );
    res
      .status(200)
      .json({ message: "password changed successfully", password: password });
  },
  support: async (req, res, next) => {
    const { error } = supportValidate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { user, support } = await userService.support(
      req.body.message,
      req.tokenPayload.id
    );
    res.json({
      user: user,
      message: "message sent to admins successfully",
      support: support,
    });
  },
  logout: async (req, res, next) => {
    const email = await userService.logout(req.tokenPayload.id);
    res.status(200).json({
      message: `user: ${email} logged out`,
    });
  },
  controlLed: async (req, res, next) => {
    const { roomName, state, ledNumber } = req.body;
    if (!roomName || !state || !ledNumber) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: roomName, state, or ledNumber",
      });
      return;
    }
    const result = await mqttService.controlLed(
      req.tokenPayload.homeId,
      roomName,
      state,
      ledNumber
    );
    res.json({
      success: true,
      message: result,
    });
  },
  createSequence: async (req, res, next) => {
    const { error } = joi
      .object({
        durationInMin: joi.number().min(1).max(60).required(),
        temp: joi.number().min(2).max(50).required(),
        occuped: joi.string().required(),
        deviceName: joi.string().min(3).max(255).required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    const { seq, device } = await userService.createSequence(
      req.tokenPayload.homeId,
      req.body
    );
    let pred;
    if (device.seqs.length == 12) {
      pred = await userService.handlePrediction(device, predict, req.io);
    }
    res.status(200).json({
      message: "Successfully created sequence",
      sequence: seq,
      pred: pred,
    });
  },
  createDevice: async (req, res, next) => {
    const { error } = joi
      .object({
        name: joi.string().min(3).max(255).required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    try {
      let name = "";
      const sameNameDevices = await Device.find({
        name: new RegExp(`^${req.body.name}.?$`, "i"),
        homeId: req.tokenPayload.homeId,
      });
      if (sameNameDevices.length == 0) {
        name = req.body.name;
      } else if (sameNameDevices.length == 1) {
        await Device.updateOne(
          { _id: sameNameDevices[0]._id },
          { $set: { name: req.body.name + 1 } }
        );
        const firstPred = await Prediction.find({
          "device.homeId": req.tokenPayload.homeId,
          "device.name": req.body.name,
        });
        await Prediction.updateOne(
          { _id: firstPred[0]._id },
          { $set: { "device.name": req.body.name + 1 } }
        );
        name = req.body.name + 2;
      } else {
        const deviceNumber = parseInt(
          sameNameDevices[sameNameDevices.length - 1].name[
            sameNameDevices[sameNameDevices.length - 1].name.length - 1
          ]
        );
        name = req.body.name + (deviceNumber + 1);
      }
      const device = new Device({
        name: name,
        homeId: req.tokenPayload.homeId,
      });
      const pred = new Prediction({
        "device.name": device.name,
        "device.homeId": device.homeId,
        "device.id": device._id,
      });
      await device.save();
      await pred.save();
      const home = await Home.findOne({ _id: req.tokenPayload.homeId });
      home.devices = await Device.find({ homeId: req.tokenPayload.homeId });
      await home.save();
      res.json({
        message: "successfully device created",
      });
    } catch (err) {
      next(err);
    }
  },
  deleteDevice: async (req, res, next) => {
    const { error } = joi
      .object({
        deviceId: joi.string().min(3).max(255).required(),
      })
      .validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    try {
      await Device.findByIdAndDelete(req.body.deviceId);
      const home = await Home.findOne({
        _id: req.tokenPayload.homeId,
        "devices._id":req.body.deviceId
      });
      if (!home) {
        res.status(400).json("device was not found in your home");
        return;
      }
      const devicesOfHome = _.filter(home.devices, (obj) => {
        return obj._id != req.body.deviceId;
      });
      home.devices = devicesOfHome;

      await home.save();

      await Prediction.findOneAndDelete({
        "device.id": req.body.deviceId,
        "device.homeId": req.tokenPayload.homeId,
      });

      await Sequential.deleteMany({
        device_id: req.body.deviceId,
        home_id: req.tokenPayload.homeId,
      });

      res.json(
        "device deleted successfully with its prediction , sequences and from this home's devices also"
      );
    } catch (err) {
      next(err);
    }
  },
};
function validate(user) {
  const schema = joi.object({
    email: joi.string().email().min(3).max(255).required(),
    password: joi.string().required(),
  });
  return schema.validate(user);
}
