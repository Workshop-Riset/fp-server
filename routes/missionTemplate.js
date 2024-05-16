const MissionTemplate = require("../controllers/MissionTemplateController");

const routes = require("express").Router();

routes.get('/', MissionTemplate.getAllMission)
routes.post('/', MissionTemplate.createMission)
routes.put('/:missionId', MissionTemplate.updateMission)
routes.delete('/:missionId', MissionTemplate.deleteMission)


module.exports = routes

