const express = require("express");
const requestController = require("../controllers/requests");
const router = express.Router();
const upload = require("../middleware/upload")
router.post("/", upload.single('profilePic'),requestController.createRequest);
module.exports = router;
