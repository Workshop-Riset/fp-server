const MissionController = require("../controllers/MissionController");

const routes = require("express").Router();

routes.get('/', MissionController.getMission)

module.exports = routes