require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const routes = require("./routes/index");
const errHandler = require("./helpers/errorHandle");
// const seederData = require("./seeders/seed");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(routes);
// seederData()
app.get("/", async (req, res) => {
  res.json("Running Bro");
});

app.use(errHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
