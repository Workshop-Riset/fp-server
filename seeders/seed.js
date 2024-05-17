const dataAdmin = require("../admin.json");
const dataPlayer = require("../playerDummy.json");
const { hashedPass } = require("../helpers/hash");
const runDb = require("../instanceServer/runDB");

// console.log(dataAdmin);
const dbUser = async () => {
  const db = await runDb();
  return db.collection("Users");
};

dataAdmin.map((el) => {
  delete el.id;
  el.password = hashedPass(el.password);
  return el;
});

dataPlayer.map((el) => {
  delete el.id;
  el.password = hashedPass(el.password);
  return el;
});
// console.log(dataAdmin);
const seederData = async () => {
  const userCollection = await dbUser();
  // console.log(userCollection);
  const seedData = await userCollection.insertMany(dataPlayer);
  if (!seedData) {
    console.log("Seeder Failed");
  }
  console.log("Seeder Success");
};

module.exports = seederData;
