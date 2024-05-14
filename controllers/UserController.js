//  GET PROFILE BY ID -> MIDDLEWARE USER ID NYA SIAPA YANG LOGIN

const runDb = require("../instanceServer/runDB");

// REGISTER

// LOGIN

// SEE PROFILE ORANG

// USER WITH MISSION

// PUSH MISSION / PATCH

//
const dbUser = async () => {
  const db = await runDb();
  return db.collection("Users");
};
class UserController {
  static async getUser(req, res, next) {
    try {
      const userCollection = await dbUser();
      const findUser = await userCollection.find().toArray();
      res.status(200).json(findUser);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
      console.log(error);
    }
  }
}

module.exports = UserController;
