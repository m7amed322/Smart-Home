const express = require("express");
const app = express();
const router = express.Router();
const serverless = require("serverless-http")
require("../startup/logging")();
require("../startup/config")();
require("../startup/routes")(app);
require("../startup/db")();

const port = process.env.PORT || 1000; // Use Netlify's port or default to 1000

router.get("/", (req, res) => {
    res.send("Hello, world!");
});

app.listen(port, () => {
    console.log(`listening to port ${port}`);
});
app.use('./netlify/functions/api',router);
module.exports.handler = serverless(app);
