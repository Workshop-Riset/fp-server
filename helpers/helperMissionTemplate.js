const { ObjectId } = require("mongodb");
const runDb = require("../instanceServer/runDB");

const dbMission = async () => {
  const db = await runDb();
  return db.collection("Missions-Template");
};

const searchTemplateMission = async (idMission) => {
  const missionCollection = await dbMission();
  const findMission = missionCollection.findOne({
    _id: new ObjectId(idMission),
  });
  return findMission;
};

module.exports = searchTemplateMission;
