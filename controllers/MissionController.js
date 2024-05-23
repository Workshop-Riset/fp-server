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

const dbMission = async () => {
  const db = await runDb();
  return db.collection("Missions-Template");
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
  static async socialMissionDetail(req, res, next) {
    try {
      const { missionId } = req.params;
      const missionCollection = await dbMission();

      if (!ObjectId.isValid(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID format" });
      }

      const mission = await missionCollection.findOne({
        _id: new ObjectId(missionId),
        type: "Social",
      });

      if (!mission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      res.status(200).json(mission);
    } catch (error) {
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
      const findMission = await missionCollection
        .find({ type: "Self" })
        .toArray();
      let missionMinLv;
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
      const { _id } = req.user;
      const missionCollection = await dbUser();

      const agg = [
        {
          $match: {
            userId: new ObjectId(_id),
          },
        },
        {
          $match: {
            status: "onGoing",
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
        {
          $match: {
            "Missions.type": "Self",
          },
        },
      ];

      const cursor = await missionCollection.aggregate(agg).toArray();
      res.status(200).json(cursor);
    } catch (error) {
      console.error("Error fetching mission details:", error);
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

  static async pushSocialMission(req, res, next) {
    try {
      const { missionId } = req.params;
      const { _id, username, photo } = req.user;
      const missionTemplate = await dbMission();
      const mission = await dbUser();
      const searchMission = await searchTemplateMission(missionId);
      if (!searchMission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      if (searchMission.type !== "Social") {
        return res.status(400).json({ message: "Only social mission!!" });
      }
      let participantExists;
      if (searchMission.participants) {
        if (searchMission.participants.length === 5) {
          return res.status(400).json({ message: "This mission has 5 people" });
        }
        participantExists = searchMission.participants.some(
          (participant) => String(participant.userId) === String(_id)
        );
      }

      if (participantExists) {
        return res
          .status(400)
          .json({ message: "You have already taken the mission" });
      }

      const insert = {
        userId: new ObjectId(_id),
        username,
        photo
      };

      const filter = { _id: new ObjectId(missionId) };
      const update =
        !searchMission.participants || searchMission.participants.length === 0
          ? { $set: { participants: [insert] } }
          : { $push: { participants: insert } };

      // Update mission template
      await missionTemplate.updateOne(filter, update);

      // Insert user mission
      await mission.insertOne({
        userId: new ObjectId(_id),
        missionId: new ObjectId(searchMission._id),
        status: "onGoing",
        photo: "",
        vote: 0,
      });

      res.status(200).json({
        message: "User added to mission participants successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async detailMission(req, res, next) {
    try {
      const { idMission } = req.params;
      const detailMission = await searchTemplateMission(idMission);
      const { _id } = req.user;
      const missionCollection = await (
        await dbMission()
      )
        .aggregate([
          {
            $match: {
              _id: new ObjectId(idMission),
            },
          },
          {
            $lookup: {
              from: "Missions",
              localField: "_id",
              foreignField: "missionId",
              as: "DetailMission",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              description: 1,
              point: 1,
              location: 1,
              thumbnail: 1,
              type: 1,
              city: 1,
              category: 1,
              pointMin: 1,
              // "DetailMission._id": 1,
              // "DetailMission.status": 1,
              // "DetailMission.missionId": 1,
              // "DetailMission.userId": 1,
              // "DetailMission.vote": 1,
              DetailMission: {
                $filter: {
                  input: "$DetailMission",
                  as: "detail",
                  cond: { $eq: ["$$detail.userId", new ObjectId(_id)] },
                },
              },
            },
          },
        ])
        .toArray();
      if (!detailMission) {
        return res.status(404).json({ message: "Mission not found" });
      }
      res.status(200).json(missionCollection);
    } catch (error) {
      next(error);
    }
  }

  static async socialMissionWithFilter(req, res, next) {
    try {
      const missionCollection = await dbMission();
      const agg = [
        {
          $match: {
            type: "Social",
          },
        }
      ];
      const cursor = await missionCollection.aggregate(agg).toArray();
      console.log(cursor, "< +++++ Cursor")
      res.status(200).json(cursor);
    } catch (error) {
      next(error);
    }
  }

  static async missionFilter(req, res, next) {
    try {
      const agg = [
        {
          $match: {
            status: "pending",
          },
        },
        {
          $lookup: {
            from: "Missions-Template",
            localField: "missionId",
            foreignField: "_id",
            as: "DetailMissions",
          },
        },
        {
          $unwind: {
            path: "$DetailMissions",
          },
        },
      ];
      const cursor = await (await dbUser()).aggregate(agg).toArray();
      console.log(cursor, "<<<");
      res.status(200).json(cursor);
    } catch (error) {
      next(error);
    }
  }

  static async getIdMissionAdmin(req, res, next) {
    try {
      const { _id } = req.params;
      console.log(_id, "<<<< id masuk");
      const agg = [
        {
          $match: {
            _id: new ObjectId(_id),
          },
        },
        {
          $match: {
            status: "pending",
          },
        },
        {
          $lookup: {
            from: "Missions-Template",
            localField: "missionId",
            foreignField: "_id",
            as: "DetailMissions",
          },
        },
        {
          $unwind: {
            path: "$DetailMissions",
          },
        },
        {
          $lookup: {
            from: "Users",
            localField: "userId",
            foreignField: "_id",
            as: "Players",
          },
        },
        {
          $unwind: {
            path: "$Players",
          },
        },
      ];
      const missionCollection = await dbUser();
      const cursor = await missionCollection.aggregate(agg).toArray();
      // console.log(cursor);
      if (!cursor) {
        return res.status(404).json({ message: "Cannot find id mission" });
      }
      return res.status(200).json(cursor);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MissionController;
