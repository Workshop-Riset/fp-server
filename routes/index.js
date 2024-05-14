const routes = require("express").Router();
const userRoute = require("./user");
routes.use("/user", userRoute);

module.exports = routes;
