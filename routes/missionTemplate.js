const authorization = require("../auth/authorization");
const { onlyAdmin } = require("../auth/middleware");
const MissionTemplate = require("../controllers/MissionTemplateController");

const routes = require("express").Router();

routes.get("/", MissionTemplate.getAllMission);
routes.post("/", authorization, onlyAdmin, MissionTemplate.createMission);
// routes.get("/:idMission", MissionTemplate.createMission);
// routes.put("/:missionId", MissionTemplate.updateMission);
// routes.delete("/:missionId", MissionTemplate.deleteMission);

module.exports = routes;
