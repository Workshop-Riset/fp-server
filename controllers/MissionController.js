const runDb = require("../instanceServer/runDB");

const dbUser = async () => {
  const db = await runDb();
  return db.collection("Missions");
};

class MissionController {
  static async getMission(req, res, next) {
    try {
      const missionCollection = await dbUser();
      const findMission = await missionCollection.find().toArray();
      res.status(200).json(findMission);
    } catch (error) {
      console.log(error);
    }
  }
  
}

module.exports = MissionController;
