//  GET PROFILE BY ID -> MIDDLEWARE USER ID NYA SIAPA YANG LOGIN
const cloudinary = require("cloudinary").v2;

const { ObjectId } = require("mongodb");
const validateEmail = require("../helpers/emailFormat");
const { hashedPass, verifPass } = require("../helpers/hash");
const { findUsername, findIdUser } = require("../helpers/userHelpers");
const runDb = require("../instanceServer/runDB");
const { signToken } = require("../helpers/jwt");
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

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

  static async register(req, res, next) {
    try {
      const { name, email, phoneNumber, username, password, category } =
        req.body;
      const inputData = {
        name,
        email,
        phoneNumber,
        username,
        password: hashedPass(password),
        photo: "",
        point: 0,
        role: "User",
        location: "Surabaya",
        category,
      };
      // console.log(phoneNumber, '<<<<');
      // if (typeof phoneNumber === "string") {
      //   throw { name: "BadInput" };
      // }
      if (!validateEmail(email)) {
        throw { name: "EmailFormat" };
      }
      if (!name) {
        throw { name: "RequiredInput", type: "Name" };
      }
      if (!email) {
        throw { name: "RequiredInput", type: "Email" };
      }
      if (!username) {
        throw { name: "RequiredInput", type: "Username" };
      }
      if (password.length < 6) {
        throw { name: "PasswordLength" };
      }
      const userCollection = await dbUser();
      const findUsername = await userCollection.findOne({ username });
      if (findUsername) {
        throw { name: "UniqueInput", type: "Username" };
      }
      const findEmail = await userCollection.findOne({ email });
      if (findEmail) {
        throw { name: "UniqueInput", type: "Email" };
      }
      const insertNewUser = await userCollection.insertOne(inputData);

      res.status(201).json({
        message: "Registasion Successfully",
        data: {
          name: inputData.name,
          email: inputData.email,
          phoneNumber: inputData.phoneNumber,
          username: inputData.username,
          location: "Surabaya",
          photo: "",
          point: 0,
          category: inputData.category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      // console.log(username , password , '<<<< - ');
      if (!username) {
        throw { name: "RequiredInput", type: "username" };
      }
      if (!password) {
        throw { name: "RequiredInput", type: "password" };
      }
      const finderUsername = await findUsername(username);
      if (!finderUsername) {
        throw { name: "InvAuth" };
      }
      // console.log(finderUsername.password, '<<<<< finder boss');
      const verification = verifPass(password, finderUsername.password);
      if (!verification) {
        throw { name: "InvAuth" };
      }
      const payload = {
        _id: new ObjectId(finderUsername._id),
        username: finderUsername.username,
        role: finderUsername.role,
      };
      const access_token = signToken(payload);
      res.status(200).json({ access_token });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async myProfile(req, res, next) {
    try {
      const { _id } = req.user;
      let findMyProfile = await findIdUser(_id);
      delete findMyProfile.password;
      delete findMyProfile.role;
      res.status(200).json(findMyProfile);
    } catch (error) {
      next(error);
    }
  }

  static async updateDescription(req, res, next) {
    try {
      const { _id } = req.user;
      const { description } = req.body;
      if (!description) {
        throw { name: "RequiredInput", type: "Description" };
      }
      const userCollection = await dbUser();
      const filter = { _id: new ObjectId(_id) };
      const updateOperation = {
        $set: { description: description },
      };
      const updateDescription = await userCollection.updateOne(
        filter,
        updateOperation
      );

      res.status(200).json({ message: "Description updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async informationUserOther(req, res, next) {
    try {
      const { userId } = req.params;
      console.log(userId, "<<<<");
      let findUser = await findIdUser(userId);
      delete findUser.password;
      delete findUser.role;
      res.status(200).json(findUser);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async getRank(req, res, next) {
    try {
      const userCollection = await dbUser();
      const agg = [
        { $match: { role: "User" } },
        { $sort: { point: -1 } },
        { $project: { password: 0 } },
      ];
      const cursor = userCollection.aggregate(agg);
      const getRanked = await cursor.toArray();
      res.status(200).json(getRanked);
    } catch (error) {
      next(error);
    }
  }

  static async updatePhotoProfile(req, res, next) {
    try {
      const { _id } = req.user;
      const userCollection = await dbUser();
      const base64Convert = req.file.buffer.toString("base64");
      const base64Url = `data:${req.file.mimetype};base64,${base64Convert}`;
      const cloudinaryRespone = await cloudinary.uploader.upload(base64Url);
      const filter = { _id: new ObjectId(_id) };
      const updateOperation = {
        $set: { photo: cloudinaryRespone.secure_url },
      };
      const updateImg = await userCollection.updateOne(filter, updateOperation);
      res.status(200).json({ message: "Update image successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async updateThumbnail(req, res, next) {
    try {
      const { _id } = req.user;

      const userCollection = await dbUser();
      const base64Convert = req.file.buffer.toString("base64");
      const base64Url = `data:${req.file.mimetype};base64,${base64Convert}`;
      const cloudinaryRespone = await cloudinary.uploader.upload(base64Url);
      const filter = { _id: new ObjectId(_id) };
      const updateOperation = {
        $set: { thumbnail: cloudinaryRespone.secure_url },
      };
      const updateThumbnail = await userCollection.updateOne(
        filter,
        updateOperation
      );
      res.status(200).json({ message: "Update thubmnail successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;

// login -> username dan password

// register - >
