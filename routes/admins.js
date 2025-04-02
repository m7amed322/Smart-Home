const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();
const adminController = require("../controllers/admins");
router.get("/request", [auth, admin], adminController.getRequest);
router.post("/createHomeAndAcc", [auth, admin], adminController.createHomeAndAcc);
router.post("/login", adminController.logIn);
router.get("/readHomes", [auth, admin], adminController.getHomes);
router.get("/users",[auth,admin],adminController.getUsers)
router.get("/support",[auth,admin],adminController.getSupport)
router.get("/readHome/:id", [auth, admin], adminController.getHomesById);
router.get("/user/:id",[auth,admin],adminController.getUsersById)
router.get("/support/:id",[auth,admin],adminController.getSupportById)
router.post("/replySupport",[auth,admin],adminController.replySupport)
router.get("/request/:id",[auth,admin],adminController.getRequestById)
router.delete("/userAndHome/:id",[auth,admin],adminController.deleteUserAndHome)

// create admin
// router.post("/",adminController.createAdmin)
module.exports = router;
