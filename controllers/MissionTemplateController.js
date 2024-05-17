const runDb = require("../instanceServer/runDB");

const dbUser = async () => {
  const db = await runDb();
  return db.collection("Missions-Template");
};

class MissionTemplate {
  static async getAllMission(req, res, next) {
    try {
      const missionTemplateCollection = await dbUser();
      const findMissionTemplate = await missionTemplateCollection
        .find()
        .toArray();
      res.status(200).json(findMissionTemplate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async createMission(req, res, next) {
    try {
      const { name, description, point, location, thumbnail, type, category } =
        req.body;
      if (!name) {
        throw { name: "RequiredInput", type: "Name Mission" };
      }
      if (!point) {
        throw { name: "RequiredInput", type: "Point Mission" };
      }
      if (!location) {
        throw { name: "RequiredInput", type: "Location Coordinat Mission" };
      }
      if (!type) {
        throw { name: "RequiredInput", type: "Type Mission" };
      }
      const inputData = {
        name,
        description,
        point,
        location,
        thumbnail,
        type,
        city: "Surabaya",
        category,
      };
      console.log(inputData.deadline, "<<< deadline");
      const missionTemplateCollection = await dbUser();
      const insertedMission = await missionTemplateCollection.insertOne(
        inputData
      );
      res.status(201).json(inputData);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = MissionTemplate;
