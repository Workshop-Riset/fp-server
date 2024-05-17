const { ObjectId } = require("mongodb");
const runDb = require("../instanceServer/runDB");

const dbUser = async () => {
  const db = await runDb();
  return db.collection("Users");
};
async function findUsername(username) {
  const userCollection = await dbUser();
  const findingUsername = await userCollection.findOne({ username });
  return findingUsername;
}

async function findIdUser(_id) {
  const userCollection = await dbUser();
  const findId = await userCollection.findOne({ _id: new ObjectId(_id) });
  return findId;
}

module.exports = { findUsername, findIdUser };
