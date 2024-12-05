const express = require("express");
const app = express();
require("./startup/logging")();
require("./startup/config")();
require("./startup/routes")(app);
require("./startup/db")();
const port = process.env.PORT || 1000;
app.listen(port, () => {
    console.log(`listening to port ${port}`);
});
