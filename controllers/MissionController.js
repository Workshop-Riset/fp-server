const byPreference = require("../helpers/byPreference");
const runDb = require("../instanceServer/runDB");
const { ObjectId } = require("mongodb");
const cloudinary = require("cloudinary").v2;

const missionFind = require("../helpers/helperMission");
const { findIdUser, updatePoint } = require("../helpers/userHelpers");
const searchTemplateMission = require("../helpers/helperMissionTemplate");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

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
      next(error);
    }
  }

  static async assignMission(req, res, next) {
    //PR:
    // v1. bikin mission dulu baru push ke user
    // 2. filter dulu missiontemplate yg type-nya "Self"
    // 3. (sunnah) set ongoingmission yg self ke gagal
    try {
      // get all users
      const dbGetUser = async () => {
        const db = await runDb();
        return db.collection("Users");
      };
      const userCollection = await dbGetUser();
      const findUser = await userCollection.find().toArray();

      let userEarly = [];
      let userMid = [];
      let userExp = [];

      // assign each user to level group
      for (let user of findUser) {
        const userLv = user.point / 100;
        if (userLv > 10) {
          userExp.push(user);
        } else if (userLv > 5) {
          userMid.push(user);
        } else {
          userEarly.push(user);
        }
      }

      // get all mission templates
      const dbMissionTemplate = async () => {
        const db = await runDb();
        return db.collection("Missions-Template");
      };
      const missionCollection = await dbMissionTemplate();
      const findMission = await missionCollection.find().toArray();

      let missionEarly = [];
      let missionMid = [];
      let missionExp = [];

      // assign each mission to level group
      for (let mission of findMission) {
        const missionMinLv = mission.pointMin / 100;
        if (missionMinLv > 10) {
          missionExp.push(mission);
        } else if (missionMinLv > 5) {
          missionMid.push(mission);
        } else {
          missionEarly.push(mission);
        }
      }

      // assign each mission to each category
      const categorizeMissions = (missions) => {
        let categorized = [[], [], []];
        for (let mission of missions) {
          switch (mission.category) {
            case "adventure":
              categorized[0].push(mission);
              break;
            case "social":
              categorized[1].push(mission);
              break;
            case "self":
              categorized[2].push(mission);
              break;
          }
        }
        return categorized;
      };

      const finalMissionEarly = categorizeMissions(missionEarly);
      const finalMissionMid = categorizeMissions(missionMid);
      const finalMissionExp = categorizeMissions(missionExp);

      // connect to db collection Missions
      const dbMissions = async () => {
        const db = await runDb();
        return db.collection("Missions");
      };
      const missionsCollection = await dbMissions();

      const assignMissionsToUsers = async (users, missions) => {
        for (let user of users) {
          const userMissionType = byPreference(user.category);
          const rand = Math.floor(
            Math.random() * missions[userMissionType].length
          );
          const missionId = missions[userMissionType][rand]._id;

          // create missions
          const inputData = {
            status: "onGoing",
            missionId,
            userId: user._id,
            vote: 0,
          };
          await missionsCollection.insertOne(inputData);
        }
      };

      await assignMissionsToUsers(userEarly, finalMissionEarly);
      await assignMissionsToUsers(userMid, finalMissionMid);
      await assignMissionsToUsers(userExp, finalMissionExp);

      res.status(200).json({ message: "all done gan" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async MissionDetail(req, res, next) {
    try {
      const { missionId } = req.params;
      const missionCollection = await dbUser();
      const agg = [
        {
          $match: {
            _id: new ObjectId(missionId),
          },
        },
        {
          $lookup: {
            from: "Missions-Template",
            localField: "missionId",
            foreignField: "_id",
            as: "Missions",
          },
        },
        {
          $unwind: {
            path: "$Missions",
          },
        },
      ];
      const cursor = await missionCollection.aggregate(agg).toArray();
      res.status(200).json(cursor);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async accMission(req, res, next) {
    //pending user kirim
    try {
      const { missionId } = req.params;
      const { _id } = req.user;
      const searchMission = await missionFind(missionId);

      if (!searchMission) {
        return res.status(404).json({ message: "Mission not found" });
      }
      if (String(searchMission.userId) !== _id) {
        return res.status(403).json({ message: "You are not authorized" });
      }

      const base64Convert = req.file.buffer.toString("base64");
      const base64Url = `data:${req.file.mimetype};base64,${base64Convert}`;
      const cloudinaryRespone = await cloudinary.uploader.upload(base64Url);
      const filter = { _id: new ObjectId(missionId) };
      const updateStatus = {
        $set: { photo: cloudinaryRespone.secure_url, status: "pending" },
      };

      await (await dbUser()).updateOne(filter, updateStatus);
      res.status(200).json({ message: "Assign mission successfully" });
    } catch (error) {
      console.log(error, "<<");
      next(error);
    }
  }

  static async acceptMissionByAdmin(req, res, next) {
    //acc
    try {
      const { idMission } = req.params;
      let { status } = req.query; //Diantara 1 / 2
      if (status > 1) {
        return res.status(400).json({ message: "Invalid Status" });
      }

      status = status ? "finished" : "rejected";

      const searchMission = await missionFind(idMission);
      if (!searchMission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      const filter = { _id: new ObjectId(idMission) };
      const updateStatus = {
        $set: { status },
      };
      await (await dbUser()).updateOne(filter, updateStatus);
      if (status === "finished") {
        // find user
        const findUser = await findIdUser(searchMission.userId);

        if (!findUser) {
          return res.status(404).json({ message: `User can't found!` });
        }

        const finderMission = await searchTemplateMission(
          String(searchMission.missionId)
        ); //search template untuk dapat point
        await updatePoint(finderMission.point, findUser._id);
      }
      res.status(200).json({ message: `Mission ${status} successfully` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MissionController;
