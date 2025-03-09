// const {load,error}=require("dotenv").config();
// const winston = require("winston");
// module.exports = function () {
//     if(error){
//     console.log("dotenv file not founded");
//     winston.error(error);
//     }
//     else{
//         winston.info("configs are set");
//         return load;
//     }
//   };
const winston = require("winston");
// require("dotenv").config();
module.exports = function () {
  if (!process.env.db_password) {
    winston.error("Environment variables not set.");
    throw new Error("Environment variables missing.");
  }
  winston.info("Configs are set successfully.");
};
