const express = require("express");
const app = express();
require("./startup/logging")();
require("./startup/config")();
require("./startup/routes")(app);
require("./startup/db")();
app.listen(process.env.PORT||1000, () => {
  console.log("listening to port 1000 ...");
});
