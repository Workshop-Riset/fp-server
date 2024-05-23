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
  console.log(_id, "< === id brooo")
  const userCollection = await dbUser();
  const findId = await userCollection.findOne({ _id: new ObjectId(_id) });
  return findId;
}

async function updatePoint(point, id) {
  const userCollection = await dbUser();
  console.log(id, '<<<<');
  const filter = { _id: new ObjectId(id) };
  const update = {
    $inc: { point: parseInt(point) },
  };

  const result = await userCollection.updateOne(filter, update);
  console.log(result, '<<<');
  return result;
}

module.exports = { findUsername, findIdUser, updatePoint };
