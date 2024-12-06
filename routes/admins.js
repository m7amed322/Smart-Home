const express = require("express");
const auth = require("../controllers/middleware/auth");
const admin = require("../controllers/middleware/admin");
const router = express.Router();
const adminController = require("../controllers/admins");
router.get("/request", [auth, admin], adminController.getRequest);
router.post("/createHomeAndAcc", [auth, admin], adminController.createHomeAndAcc);
router.post("/login", adminController.logIn);
router.get("/readHomes", [auth, admin], adminController.getHomes);
// create admin
// router.post("/",adminController.createAdmin)
module.exports = router;
