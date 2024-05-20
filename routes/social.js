const authorization = require("../auth/authorization");
const MissionController = require("../controllers/MissionController");

const routes = require("express").Router();

routes.post("/:missionId", authorization, MissionController.pushSocialMission);
module.exports = routes;
