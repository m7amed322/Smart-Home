const { Alert } = require("../models/alert");
const { wrapper } = require("../utils/helper");
const AlertService = {
  createAlert: wrapper(async (userId, message, io = null) => {
    const alert = new Alert({ userId, message ,createdAt:new Date()});
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
  markAllAsRead:wrapper(async(userId)=>{
    const alert = await Alert.find({ userId:userId,read:false });
    if (alert.length==0) {
      throw new Error("no alerts not readed");
    }
    await Alert.updateMany({userId:userId,read:false},{$set:{read:true}});
    return "all alerts is read"
  }),
  getAlerts:wrapper(async(userId)=>{
    const alerts = await Alert.find({userId:userId});
    if (!alerts) {
      throw new Error("no alerts for now");
    }
    return alerts;
  }),
  deleteAlerts:wrapper(async(userId)=>{
    const alerts = await Alert.find({userId:userId});
    if (!alerts) {
      throw new Error("no alerts to delete");
    }
    await Alert.deleteMany({userId:userId});
    return "Alerts deleted successfully"
  }),
  deleteById:wrapper(async(userId,alertId)=>{
    const alert = await Alert.findOne({userId:userId,_id:alertId});
    if(!alert){
      throw new Error ("wrong alert id or no alert to delete")
    }
    await Alert.deleteOne({_id:alertId,userId:userId});
    return "Alert deleted successfully"
  }),
  markAsRead:wrapper(async(userId,alertId)=>{
    const alert = await Alert.findOne({ userId:userId,read:false,_id:alertId });
    if (!alert) {
      throw new Error("alert not found or it is already read");
    }
    await Alert.updateOne({userId:userId,_id:alertId,read:false},{$set:{read:true}});
    return "this alerts is read"
  })
};
module.exports = AlertService;
