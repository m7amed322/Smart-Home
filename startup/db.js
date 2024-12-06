const mongoose = require("mongoose");
const winston = require("winston");
module.exports = async function () {
    try {
        await mongoose.connect(
            `mongodb+srv://mohamedabdalslam678:${process.env.db_password}@graduationproject.hspls.mongodb.net/?retryWrites=true&w=majority&appName=graduationProject`
        );
        winston.info("MongoDB connected successfully.");
    } catch (err) {
        winston.error("MongoDB connection failed.", err);
        throw err;
    }
};