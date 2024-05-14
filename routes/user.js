const UserController = require("../controllers/UserController");

const routes = require("express").Router();

routes.get("/", UserController.getUser);

module.exports = routes;
