require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const routes = require('./routes/index');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(routes)


app.get("/", async (req, res) => {
  res.json('Running Bro')
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
