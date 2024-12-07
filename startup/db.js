const mongoose = require("mongoose");
const winston = require("winston");
// winston.add(new winston.transports.Console())
module.exports = function () {
        mongoose.connect(
            `mongodb+srv://mohamedabdalslam678:${process.env.db_password}@graduationproject.hspls.mongodb.net/?retryWrites=true&w=majority&appName=graduationProject`
        ).then(()=>winston.info("MongoDB connected successfully.")).catch((err)=>{winston.error("MongoDB failed to connect",err)})
        
    
};