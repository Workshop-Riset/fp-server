const { ObjectId } = require("mongodb");
const runDb = require("../instanceServer/runDB");

const dbUser = async () => {
  const db = await runDb();
  return db.collection("Missions");
};

async function missionFind(id) {
  const userCollection = await dbUser();
  const findUser = await userCollection.findOne({ _id: new ObjectId(id) });
  return findUser;
}
module.exports = missionFind;
