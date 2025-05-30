require("express-async-errors");
const express = require("express");
const requests = require("../routes/requests");
const admin = require("../routes/admins");
const error = require("../middleware/error");
const users = require("../routes/users");
const cors = require("cors");
const path = require("path");
module.exports = function (app, io) {
  app.use(
    cors({
      origin: "*",
      exposedHeaders: ["x-auth-token"],
    })
  );
  app.use(express.json());
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
  app.use("/api", requests);
  app.use("/api/admin", admin);
  app.use("/api/users", users);
  app.use(error);
};
