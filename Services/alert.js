const { Alert } = require("../models/alert");
const { wrapper } = require("../utils/helper");
const AlertService = {
  createAlert: wrapper(async (userId, message, io = null) => {
    const alert = new Alert({ userId, message });

    if (io) {
      io.emit(`${userId}`, {
        id: alert._id,
        message,
        createdAt: new Date(),
        userId: userId,
      });
      await alert.save();
    }
    return alert;
  }),
  getUnread: wrapper(async (userId) => {
    const alerts = await Alert.find({ userId:userId, read: false });
    if (!alerts) {
      throw new Error("there's no alerts for that user ");
    }
    return alerts;
  }),
  getById: wrapper(async (alertId) => {
    const alert = await Alert.findOne({ _id: alertId });
    if (!alert) {
      throw new Error("alert not found");
    }
    alert.read = true;
    await alert.save();
    return alert;
  }),
  markAsRead:wrapper(async(userId)=>{
    const alert = await Alert.findOne({ userId:userId,read:false });
    if (!alert) {
      throw new Error("no alerts not readed");
    }
    await Alert.updateMany({userId:userId,read:false},{$set:{read:true}});
    return "all alerts is readed"
  }),
  getAlerts:wrapper(async(userId)=>{
    const alerts = await Alert.find({userId:userId});
    if (!alerts) {
      throw new Error("no alerts for now");
    }
    return alerts;
  })
};
module.exports = AlertService;
