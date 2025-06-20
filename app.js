const express = require("express")
const winston = require("winston")
const {createServer} = require("node:http");
const {Server} = require("socket.io");
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
require("./startup/mqtt")(io);
// require("./startup/prod")(app);
app.use('/api/uploads',express.static('uploads'))
const port = process.env.PORT || 1000
server.listen(port,()=>{
    winston.info(`listening to port ${port}...`)
})