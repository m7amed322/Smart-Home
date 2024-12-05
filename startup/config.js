const {load,error}=require("dotenv").config();
const winston = require("winston");
module.exports = function () {
    if(error){
    console.log("dotenv file not founded");
    winston.error(error);
    }
    else{
        winston.info("configs are set");
        return load;
    }
  };