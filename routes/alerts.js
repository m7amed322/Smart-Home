const AlertController = require("../controllers/alert");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
module.exports = (io) => {
  const alertController = new AlertController(io);
  router.get("/unread", auth, alertController.getUnread.bind(alertController));
  return router;
};
