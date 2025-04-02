require("express-async-errors");
const express = require("express");
const requests = require("../routes/requests");
const admin = require("../routes/admins");
const error = require("../middleware/error");
const users = require("../routes/users");
const alerts = require("../routes/alerts");
const cors  =require("cors");
const path = require("path")
module.exports = function (app,io) {
  app.use(cors({
    origin:'*',
    exposedHeaders:['x-auth-token']
  }));
  app.use(express.json());
 
  app.use("/api/sendRequests", requests);
  app.use("/api/admin", admin);
  app.use("/api/users", users);
  app.use("/api/alert",alerts(io))
  app.use(error);
};
