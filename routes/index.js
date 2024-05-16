const routes = require("express").Router();
const userRoute = require("./user");
const missionRoute = require('./mission')
const missionTemplateRoute = require('./missionTemplate')

routes.use("/user", userRoute);
routes.use('/mission', missionRoute)
routes.use('/mission-template', missionTemplateRoute)

module.exports = routes;
