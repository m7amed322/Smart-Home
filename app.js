const express = require("express")
const serverless = require ("serverless-http");
const app = express()
app.get("/",(req,res)=>{
    res.json({
        message: "hello from netlify"
    })
})
require("./startup/logging")();
require("./startup/config")();
require("./startup/routes")(app);
require("./startup/db")();
// app.listen(1000,()=>{
//     console.log("1000 ...")
// })
module.exports.handler = serverless(app);
