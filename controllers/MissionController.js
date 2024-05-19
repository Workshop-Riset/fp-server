const byPreference = require("../helpers/byPreference");
const runDb = require("../instanceServer/runDB");
const { ObjectId } = require("mongodb");

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
  static async assignMission(req, res, next) {
    //PR:
    // v1. bikin mission dulu baru push ke user
    // 2. filter dulu missiontemplate yg type-nya "Self"
    // 3. (sunnah) set ongoingmission yg self ke gagal
    try {
      // get all user
      const dbGetUser = async () => {
        const db = await runDb();
        return db.collection("Users");
      };
      const userCollection = await dbGetUser();
      const findUser = await userCollection.find().toArray();
      let userLv;
      let userEarly = [];
      let userMid = [];
      let userExp = [];

      // assign each user to level group
      for (let i = 0; i < findUser.length; i++) {
        userLv = findUser[i].point / 100;
        if (userLv > 10) {
          userExp.push(findUser[i]);
        } else if (userLv > 5) {
          userMid.push(findUser[i]);
        } else {
          userEarly.push(findUser[i]);
        }
      }

      // get all mission
      const dbMissionTemplate = async () => {
        const db = await runDb();
        return db.collection("Missions-Template");
      };
      const missionCollection = await dbMissionTemplate();
      const findMission = await missionCollection.find().toArray();
      let missionMinLv;
      let missionEarly = [];
      let missionMid = [];
      let missionExp = [];

      // assign each mission to level group
      for (let i = 0; i < findMission.length; i++) {
        missionMinLv = findMission[i].pointMin / 100;
        if (missionMinLv > 10) {
          missionExp.push(findMission[i]);
        } else if (missionMinLv > 5) {
          missionMid.push(findMission[i]);
        } else {
          missionEarly.push(findMission[i]);
        }
      }

      // assign each mission to each category
      // [[adventure], [social], [self]]
      let finalMissionEarly = [[], [], []];
      let finalMissionMid = [[], [], []];
      let finalMissionExp = [[], [], []];
      for (let i = 0; i < missionEarly.length; i++) {
        switch (missionEarly[i].category) {
          case "adventure":
            finalMissionEarly[0].push(missionEarly[i]);
            break;
          case "social":
            finalMissionEarly[1].push(missionEarly[i]);
            break;
          case "self":
            finalMissionEarly[2].push(missionEarly[i]);
            break;
        }
      }
      for (let i = 0; i < missionMid.length; i++) {
        switch (missionMid[i].category) {
          case "adventure":
            finalMissionMid[0].push(missionMid[i]);
            break;
          case "social":
            finalMissionMid[1].push(missionMid[i]);
            break;
          case "self":
            finalMissionMid[2].push(missionMid[i]);
            break;
        }
      }
      for (let i = 0; i < missionExp.length; i++) {
        switch (missionExp[i].category) {
          case "adventure":
            finalMissionExp[0].push(missionExp[i]);
            break;
          case "social":
            finalMissionExp[1].push(missionExp[i]);
            break;
          case "self":
            finalMissionExp[2].push(missionExp[i]);
            break;
        }
      }
      // connect to db collection Mission
      const dbMissions = async () => {
        const db = await runDb();
        return db.collection("Missions");
      };
      const missionsCollection = await dbMissions();

      // assign each user group level to each of its own preference by probability
      let userMissionType;
      let rand;

      for (let i = 0; i < userEarly.length; i++) {
        // see which category user preference
        userMissionType = byPreference(userEarly[i].category);

        // randoming index inside the user category preference
        rand = Math.floor(
          Math.random() * finalMissionEarly[userMissionType].length
        );
        const missionId = finalMissionEarly[userMissionType][rand]._id;

        // create missions
        const inputData = {
          status: "onGoing",
          missionId,
          userId: userEarly[i]._id,
          vote: 0,
        };
        const insertedMission = await missionsCollection.insertOne(inputData);

        // // (past) push missionId to Users.onGoingMissionId
        // const filter = { _id: userEarly[i]._id };
        // const pushOperation = {
        //   $push: { onGoingMissionId: missionId },
        // };
        // const pushOnGoingMissionId = await userCollection.updateOne(
        //   filter,
        //   pushOperation
        // );
      }
      for (let i = 0; i < userMid.length; i++) {
        // see which category user preference
        userMissionType = byPreference(userMid[i].category);
        // randoming index inside the user category preference
        rand = Math.floor(
          Math.random() * finalMissionMid[userMissionType].length
        );

        const missionId = finalMissionMid[userMissionType][rand]._id;

        // create missions
        const inputData = {
          status: "onGoing",
          missionId,
          userId: userMid[i]._id,
          vote: 0,
        };
        const insertedMission = await missionsCollection.insertOne(inputData);

        // const filter = { _id: userMid[i]._id };
        // const pushOperation = {
        //   $push: { onGoingMissionId: missionId },
        // };
        // const pushOnGoingMissionId = await userCollection.updateOne(
        //   filter,
        //   pushOperation
        // );
      }
      for (let i = 0; i < userExp.length; i++) {
        // see which category user preference
        userMissionType = byPreference(userExp[i].category);
        // randoming index inside the user category preference
        rand = Math.floor(
          Math.random() * finalMissionExp[userMissionType].length
        );

        const missionId = finalMissionExp[userMissionType][rand]._id;

        // create missions
        const inputData = {
          status: "onGoing",
          missionId,
          userId: userExp[i]._id,
          vote: 0,
        };
        const insertedMission = await missionsCollection.insertOne(inputData);

        // const filter = { _id: userExp[i]._id };
        // const pushOperation = {
        //   $push: { onGoingMissionId: missionId },
        // };
        // const pushOnGoingMissionId = await userCollection.updateOne(
        //   filter,
        //   pushOperation
        // );
      }

      res.status(200).json({ message: "all done gan" });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = MissionController;
