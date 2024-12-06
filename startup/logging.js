// require("express-async-errors");
// const winston = require("winston");
// winston.add(
//   new winston.transports.Console(),
//   new winston.transports.File({ filename: "logging.log" })
// );
// module.exports = function () {
//   winston.exceptions.handle(
//     new winston.transports.File({ filename: "logging.log" })
//   );
//   winston.rejections.handle(
//     new winston.transports.File({ filename: "logging.log" })
//   );
// };
require("express-async-errors");
const winston = require("winston");
winston.add(new winston.transports.Console());
module.exports = function () {
    winston.exceptions.handle(new winston.transports.Console());
    winston.rejections.handle(new winston.transports.Console());
};