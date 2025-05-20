const express = require("express");
const router = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const auth = require("../middleware/auth");
const userController = require("../controllers/users");
const upload = require("../middleware/upload");
router.post("/login", userController.logIn);
router.get("/home", auth, userController.getHome);
// router.post(
//   "/oauth/google",
//   passport.authenticate("googleToken", { session: false }),
//   userController.googleLogIn
// );
router.post("/forgot", userController.forgotPassword);
router.patch("/reset/:token", userController.resetPassword);
router.post("/firstTimePassword", auth, userController.firstTimePassword);
router.get("/me", auth, userController.getMe);
router.get("/alert/Unread",auth,userController.unreadAlerts);
router.get("/alert/:id",auth,userController.alertById);
router.get("/alerts",auth,userController.getAlerts);
router.put("/alert/markAllAsRead",auth,userController.markAllAsRead);
router.put("/alert/markAsRead/:id",auth,userController.markAsRead);
router.post("/support", auth, userController.support);
router.post("/logout", auth, userController.logout);
router.post("/control", auth, userController.controlLed);
router.post("/createSeq", auth, userController.createSequence);
router.delete("/alerts",auth,userController.deleteAlerts);
router.delete("/alert/:id",auth,userController.deleteAlertById);
router.patch("/me",auth,upload.single('profilePic'),userController.updateMe);
router.post("/control",auth,userController.controlLed);
router.post("/ledState",auth,userController.ledsState);
module.exports = router;
