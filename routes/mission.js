const authorization = require("../auth/authorization");
const { onlyAdmin } = require("../auth/middleware");
const MissionController = require("../controllers/MissionController");

const routes = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

routes.get("/", MissionController.getMission);
routes.post("/assign", MissionController.assignMission);

routes.get("/my-mission", authorization, MissionController.MissionDetail);

routes.get("/filterPending", MissionController.missionFilter);

routes.post(
  "/:missionId",
  authorization,
  upload.single("image"),
  MissionController.accMission
);
routes.patch(
  "/:idMission",
  authorization,
  onlyAdmin,
  MissionController.acceptMissionByAdmin
);
routes.get("/admin/:_id", MissionController.getIdMissionAdmin);
routes.get("/:idMission", authorization, MissionController.detailMission);
module.exports = routes;
