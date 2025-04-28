const express = require("express");
const router = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const auth = require("../middleware/auth");
const userController = require("../controllers/users");
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
router.post("/support", auth, userController.support);
router.post("/logout", auth, userController.logout);
router.post("/control", auth, userController.controlLed);
router.post("/createDevice", auth, userController.createDevice);
router.post("/createSeq", auth, userController.createSequence);
router.delete("/device",auth,userController.deleteDevice);
module.exports = router;
