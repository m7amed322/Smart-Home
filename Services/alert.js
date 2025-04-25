const {Alert} = require("../models/alert");
const  AlertService ={
  createAlert: async (userId, message,io=null)=> {
    try {
      const alert = new Alert({ userId, message });
      await alert.save();
      if (io) {
        io.to(userId).emit("alert", {
          id: alert._id,
          message,
          createdAt: alert.createdAt,
        });
      }
      return alert;
    } catch (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  },
  getUnread: async (userId)=> {
    return await Alert.find({ userId, read: false });
  }
}
module.exports = AlertService;
