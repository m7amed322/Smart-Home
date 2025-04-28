const _ = require("lodash");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const AlertService = require("./alert");
const { User } = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Home } = require("../models/home");
const { wrapper } = require("../utils/helper");
const path = require("path");
const sendEmail = require("./emaiil");
const { Support } = require("../models/support");
const userService = {
  createSequence: async (homeId, seqData) => {
    try {
      const device = await Device.findOne({
        homeId: homeId,
        name: seqData.deviceName,
      });
      if (!device) {
        throw new Error("device of this home not found ");
      }
      const deviceNameInSeq = seqData.deviceName.slice(
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
      return { seq, device };
    } catch (err) {
      throw ("failed of creating a sequential document: ", err);
    }
  },
  handlePrediction: async (device, predFun, io = null) => {
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
        const user = await User.findOne({ "home._id": device.homeId });
        if (predValue > 50) {
          const alert = await AlertService.createAlert(
            user._id,
            `from the device:${device.name} the predicted value after 6 hours:${predValue} `,
            io
          );
        }
        return prediction;
      }
      return;
    } catch (err) {
      throw err;
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
      throw new Error("access denied"); // because to use this endpoin u must be authenticated so u are admin or user
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
