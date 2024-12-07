const express = require("express")
// const serverless = require ("serverless-http");
const winston = require("winston")
const app = express()
require("./startup/logging")();
require("./startup/config")();
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/prod")(app);

const port = process.env.PORT || 1000
app.listen(port,()=>{
    winston.info(`listening to port ${port}...`)
})
