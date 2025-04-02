const Alert = require("../models/alert");
class AlertService {
  constructor(io) {
    this.io = io;
  }
  async createAlert(userId, message) {
    const alert = new Alert({ userId, message });
    await alert.save();
    this.io.to(userId).emit("alert", {
      id: alert._id,
      message,
      createdAt: Date.now(),
    });
    return alert;
  }
  async getUnread(userId) {
    return await Alert.find({ userId, read: false });
  }
}
module.exports = AlertService;
