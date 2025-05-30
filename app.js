const express = require("express")
const winston = require("winston")
const {createServer} = require("node:http");
const {Server} = require("socket.io");
const mqtt = require("mqtt");
const mqttServices = require("./Services/mqtt");
const app = express()
const server = createServer(app);
const io = new Server(server,{cors:{
      origin: "*",
      credentials:true
    }});
require("./startup/logging")();
require("./startup/config")();
require("./startup/routes")(app,io);
require("./startup/db")();
mqttServices.connect(mqtt);
// require("./startup/prod")(app);
app.use('/api/uploads',express.static('uploads'))
const port = process.env.PORT || 1000
server.listen(port,()=>{
    winston.info(`listening to port ${port}...`)
})