const express = require("express")
const serverless = require ("serverless-http");
const app = express()
require("../../startup/logging")();
require("../../startup/config")();
require("../../startup/routes")(app);
require("../../startup/db")();

module.exports.handler = serverless(app);
