const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();
const adminController = require("../controllers/admins");
router.get("/request", [auth, admin], adminController.getRequest);///
router.post("/login", adminController.logIn);///
router.get("/homes", [auth, admin], adminController.getHome);///
router.get("/users",[auth,admin],adminController.getUser)///
router.get("/supports",[auth,admin],adminController.getSupport)///
router.get("/home/:id", [auth, admin], adminController.getHomeById);///
router.get("/user/:id",[auth,admin],adminController.getUserById)///
router.get("/support/:id",[auth,admin],adminController.getSupportById)///
router.post("/support",[auth,admin],adminController.replySupport)
router.get("/request/:id",[auth,admin],adminController.getRequestById)///
router.post("/logout",[auth,admin],adminController.logout)///
router.post("/forgot", adminController.forgotPassword);///
router.patch("/reset/:token", adminController.resetPassword); ///
router.get("/me",[auth,admin],adminController.getMe);///
router.post("/home",[auth,admin],adminController.createHome);
router.post("/user",[auth,admin],adminController.createAcc)
// create admin
// router.post("/",adminController.createAdmin)
module.exports = router;
