const routes = require("express").Router();
const userRoute = require("./user");
const missionRoute = require("./mission");
const missionTemplateRoute = require("./missionTemplate");
const UserController = require("../controllers/UserController");

routes.use("/user", userRoute);
routes.use("/mission", missionRoute);
routes.use("/mission-template", missionTemplateRoute);
routes.use("/rank-user", UserController.getRank);
module.exports = routes;
