const runDb = require("../instanceServer/runDB");

const dbUser = async () => {
    const db = await runDb();
    return db.collection("Missions-Template");
};

class MissionTemplate {
    static async getAllMission(req, res, next) {
        try {
            const missionTemplateCollection = await dbUser();
            const findMissionTemplate = await missionTemplateCollection.find().toArray();
            res.status(200).json(findMissionTemplate);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    static async createMission(req, res, next) {
        try {
            const missionData = req.body;
            console.log(req.body,'>>inibody');
            const missionTemplateCollection = await dbUser();
            const insertedMission = await missionTemplateCollection.insertOne(missionData);
            res.status(201).json(insertedMission.ops[0]);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    static async getMissionById(req, res, next) {
        try {
            const missionId = req.params.id;
            const missionTemplateCollection = await dbUser();
            const mission = await missionTemplateCollection.findOne({ _id: ObjectId(missionId) });
            if (!mission) {
                return res.status(404).json({ error: "Mission not found" });
            }
            res.status(200).json(mission);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    static async updateMission(req, res, next) {
        try {
            const missionId = req.params.id;
            console.log(missionId,"id");
            const updatedMissionData = req.body;
            const missionTemplateCollection = await dbUser();
            
            const result = await missionTemplateCollection.updateOne(
                { _id: ObjectId(missionId) },
                { $set: updatedMissionData }
            );
    
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Mission not found" });
            }
            
            res.status(200).json({ message: "Mission updated successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    

    static async deleteMission(req, res, next) {
        try {
            const missionId = req.params.id;
            const missionTemplateCollection = await dbUser();
            const deletionResult = await missionTemplateCollection.deleteOne({ _id: ObjectId(missionId) });
            if (deletionResult.deletedCount === 0) {
                return res.status(404).json({ error: "Mission not found" });
            }
            res.status(204).send();
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = MissionTemplate;
