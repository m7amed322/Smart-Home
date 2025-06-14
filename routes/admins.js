const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");
const router = express.Router();
const adminController = require("../controllers/admins");
const adminService = require("../Services/admin");
router.get("/request", [auth, admin], adminController.getRequest);
router.post("/login", adminController.logIn);
router.get("/homes", [auth, admin], adminController.getHome);
router.get("/users",[auth,admin],adminController.getUser)
router.get("/supports",[auth,admin],adminController.getSupport)
router.get("/home/:id", [auth, admin], adminController.getHomeById);
router.get("/user/:id",[auth,admin],adminController.getUserById)
router.get("/support/:id",[auth,admin],adminController.getSupportById)
router.post("/support",[auth,admin],adminController.replySupport)
router.get("/request/:id",[auth,admin],adminController.getRequestById)
router.post("/logout",[auth,admin],adminController.logout)
router.post("/forgot", adminController.forgotPassword);
router.patch("/reset/:token", adminController.resetPassword); 
router.get("/me",[auth,admin],adminController.getMe);
router.post("/home",[auth,admin],adminController.createHome);
router.post("/user",[auth,admin],adminController.createAcc);
router.delete("/device",[auth,admin],adminController.deleteDevice);
router.delete("/room",[auth,admin],adminController.deleteRoom)
router.post("/device",[auth,admin],adminController.addDevice);
router.post("/room",[auth,admin],adminController.addRoom);
router.patch("/me",[auth,admin],upload.single('profilePic'),adminController.updateMe);
router.patch("/password",[auth,admin],adminController.changePassword)
router.post("/logout", [auth,admin], adminController.logout);

// create admin
// router.post("/",adminController.createAdmin)
module.exports = router;
