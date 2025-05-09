const mqttService = require("../Services/mqtt.js");
const predict = require("../utils/consumptionPrediction.js");
const userService = require("../Services/user.js");
const accountValidation = require("../validations/account.js");
const userValidation = require("../validations/user.js");
const AlertService = require("../Services/alert.js");
module.exports = {
  logIn: async (req, res, next) => {
    const { error } = accountValidation.acc(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const { user, token } = await userService.logIn(
      req.body.email,
      req.body.password
    );
    res.header("x-auth-token", token);
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
    const { error } = accountValidation.email(req.body);
    if (error) {
      return next(error.details[0]);
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
    const { error } = userValidation.message(req.body);
    if (error) {
      return next(error.details[0]);
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
      message: `user: ${email} is logged out`,
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
    const { error } = userValidation.sequence(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const result = await userService.createSequence(
      req.tokenPayload.homeId,
      req.body
    );
    if (!result || (!result.device && !result.room)) {
      return res.status(400).json({ error: "Invalid sequence data" });
    }
    const { seq, room, device, indexOfLed } = result;
    if (room && indexOfLed === undefined) {
      return res.status(400).json({ error: "indexOfLed is undefined" });
    }
    if (device) {
      const { prediction, alert } = await userService.handlePrediction(
        predict,
        req.io,
        null,
        null,
        device
      );
      res.status(200).json({
        message: "Successfully created sequence",
        sequence: seq,
        pred: prediction,
        alert: alert,
      });
      return;
    }
    if (room) {
      const predictionResult = await userService.handlePrediction(
        predict,
        req.io,
        indexOfLed,
        room,
        null
      );
      if (!predictionResult) {
        return res
          .status(500)
          .json({ error: "handlePrediction returned undefined" });
      }
      const { prediction, alert } = predictionResult;
      res.status(200).json({
        message: "Successfully created sequence",
        sequence: seq,
        pred: prediction,
        alert: alert,
      });
      return;
    }
  },
  unreadAlerts: async (req, res, next) => {
    const alerts = await AlertService.getUnread(req.tokenPayload.id);
    res.json({
      unreadAlerts: alerts,
    });
  },
  alertById: async (req, res, next) => {
    const alert = await AlertService.getById(req.params.id);
    res.json({
      alert: alert,
    });
  },
  markAllAsRead: async (req, res, next) => {
    const message = await AlertService.markAllAsRead(req.tokenPayload.id);
    res.json({
      message: message,
    });
  },

  getAlerts: async (req, res, next) => {
    const alerts = await AlertService.getAlerts(req.tokenPayload.id);
    res.json({
      alerts: alerts,
    });
  },
  deleteAlerts: async (req, res, next) => {
    const message = await AlertService.deleteAlerts(req.tokenPayload.id);
    res.json({
      message: message,
    });
  },
  deleteAlertById: async (req, res, next) => {
    const message = await AlertService.deleteById(
      req.tokenPayload.id,
      req.params.id
    );
    res.json({
      message: message,
    });
  },
  markAsRead: async (req, res, next) => {
    const message = await AlertService.markAsRead(
      req.tokenPayload.id,
      req.params.id
    );
    res.json({ message });
  },
  updateMe: async (req, res, next) => {
    const { error } = userValidation.update(req.body);
    if (error) {
      return next(error.details[0]);
    }
    const user = await userService.updateMe(
      req.tokenPayload.id,
      req.body.fullName,
      req.body.email,
      req.file,
      req.body.currentPass,
      req.body.newPass
    );
    res.json({
      user,
      message: "user updated successfully",
    });
  },
};
