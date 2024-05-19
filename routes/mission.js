const MissionController = require("../controllers/MissionController");

const routes = require("express").Router();

routes.get("/", MissionController.getMission);
routes.post("/assign", MissionController.assignMission);

module.exports = routes;
