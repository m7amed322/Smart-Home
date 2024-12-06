const mongoose = require("mongoose");
const winston = require("winston");

let isConnected = false;

module.exports = async function () {
    if (isConnected) {
        winston.info("MongoDB connection reused.");
        return;
    }

    try {
        const connection = await mongoose.connect(
            `mongodb+srv://mohamedabdalslam678:${process.env.db_password}@graduationproject.hspls.mongodb.net/?retryWrites=true&w=majority&appName=graduationProject`
        );
        isConnected = !!connection.connections[0].readyState;
        winston.info("MongoDB connected successfully.");
    } catch (err) {
        winston.error("MongoDB connection failed.", err);
        throw err;
    }
};