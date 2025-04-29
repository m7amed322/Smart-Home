const {Alert} = require("../models/alert");
const  AlertService ={
  createAlert: async (userId, message,io=null)=> {
    try {
      const alert = new Alert({ userId, message });
      
      if (io) {
        io.emit(`${userId}`, {
          id: alert._id,
          message,
          createdAt: alert.createdAt,
          userId:userId
        });
        await alert.save();
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
