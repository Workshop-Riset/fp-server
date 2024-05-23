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
      const { name, email, phoneNumber, username, password, category } = req.body;
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
      if (!validateEmail(email)) {
        throw { name: "EmailFormat" };
      }
      
      const userCollection = await dbUser();
      
      const existingUsername = await userCollection.findOne({ username });
      if (existingUsername) throw { name: "UniqueInput", message: "Username is already taken" };
      
      const existingEmail = await userCollection.findOne({ email });
      if (existingEmail) throw { name: "UniqueInput", message: "Email is already registered" };
      

      const insertNewUser = await userCollection.insertOne(inputData);

      res.status(201).json({
        message: "Registration Successfully",
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
      console.log(error,'>>'); // Tambahkan log untuk melihat error detail
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || username === "") {
        throw { name: "RequiredInput", type: "username" };
      }
      if (!password || password === "") {
        throw { name: "RequiredInput", type: "password" };
      }
      const finderUsername = await findUsername(username);
      if (!finderUsername) {
        throw { name: "InvAuth" };
      }
      const verification = verifPass(password, finderUsername.password);
      if (!verification) {
        throw { name: "InvAuth" };
      }
      const payload = {
        _id: new ObjectId(finderUsername._id),
        username: finderUsername.username,
        role: finderUsername.role,
        photo: finderUsername.photo
      };
      console.log(payload, "< === payload")
      const access_token = signToken(payload);
      res.status(200).json({ access_token, role: finderUsername.role });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async myProfile(req, res, next) {
    try {
      const { _id } = req.user;
      console.log(_id, "<<< id");
      const userCollection = await dbUser();
      const agg = [
        {
          $match: {
            _id: new ObjectId(_id),
          },
        },
        {
          $lookup: {
            from: "Missions",
            localField: "_id",
            foreignField: "userId",
            as: "Mission",
          },
        },
        {
          $unwind: {
            path: "$Mission",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            userId: {
              $first: "$_id",
            },
            name: {
              $first: "$name",
            },
            email: {
              $first: "$email",
            },
            phoneNumber: {
              $first: "$phoneNumber",
            },
            username: {
              $first: "$username",
            },
            password: {
              $first: "$password",
            },
            photo: {
              $first: "$photo",
            },
            point: {
              $first: "$point",
            },
            role: {
              $first: "$role",
            },
            location: {
              $first: "$location",
            },
            description: {
              $first: "$description",
            },
            thumbnail: {
              $first: "$thumbnail",
            },
            category: {
              $first: "$category",
            },
            onGoingMissions: {
              //self -> finished, onGoing
              $push: {
                $cond: {
                  if: {
                    $eq: ["$Mission.status", "onGoing"],
                  },
                  then: "$Mission",
                  else: null,
                },
              },
            },
            finishedMissions: {
              //social ->
              $push: {
                $cond: {
                  if: {
                    $eq: ["$Mission.status", "finished"],
                  },
                  then: "$Mission",
                  else: null,
                },
              },
            },
          },
        },
        {
          $project: {
            onGoingMissions: {
              $filter: {
                input: "$onGoingMissions",
                as: "mission",
                cond: {
                  $ne: ["$$mission", null],
                },
              },
            },
            finishedMissions: {
              $filter: {
                input: "$finishedMissions",
                as: "mission",
                cond: {
                  $ne: ["$$mission", null],
                },
              },
            },
            userId: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            username: 1,
            password: 1,
            photo: 1,
            point: 1,
            role: 1,
            location: 1,
            description: 1,
            thumbnail: 1,
            category: 1,
          },
        },
        {
          $unwind: {
            path: "$onGoingMissions",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$finishedMissions",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "Missions-Template",
            localField: "onGoingMissions.missionId",
            foreignField: "_id",
            as: "onGoingMissions.Details",
          },
        },
        {
          $lookup: {
            from: "Missions-Template",
            localField: "finishedMissions.missionId",
            foreignField: "_id",
            as: "finishedMissions.Details",
          },
        },
        {
          $group: {
            _id: "$_id",
            userId: {
              $first: "$userId",
            },
            name: {
              $first: "$name",
            },
            email: {
              $first: "$email",
            },
            phoneNumber: {
              $first: "$phoneNumber",
            },
            username: {
              $first: "$username",
            },
            password: {
              $first: "$password",
            },
            photo: {
              $first: "$photo",
            },
            point: {
              $first: "$point",
            },
            role: {
              $first: "$role",
            },
            location: {
              $first: "$location",
            },
            description: {
              $first: "$description",
            },
            thumbnail: {
              $first: "$thumbnail",
            },
            category: {
              $first: "$category",
            },
            onGoingMissions: {
              $addToSet: "$onGoingMissions",
            },
            finishedMissions: {
              $addToSet: "$finishedMissions",
            },
          },
        },
      ];
      const cursor = await userCollection.aggregate(agg).toArray();
      const userProfile = cursor[0];

      if (userProfile) {
        delete userProfile.role;
        res.status(200).json(userProfile);
      }
    } catch (error) {
      next(error);
    }
  }

  // static async updateDescription(req, res, next) {
  //   try {
  //     const { _id } = req.user;
  //     const { description } = req.body;
  //     if (!description) {
  //       throw { name: "RequiredInput", type: "Description" };
  //     }
  //     const userCollection = await dbUser();
  //     const filter = { _id: new ObjectId(_id) };
  //     const updateOperation = {
  //       $set: { description: description },
  //     };
  //     const updateDescription = await userCollection.updateOne(
  //       filter,
  //       updateOperation
  //     );

  //     res.status(200).json({ message: "Description updated successfully" });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async updateProfile(req, res, next) {
    try {
      const { _id } = req.user;
      console.log(_id, "< === id user")
      const { description } = req.body;
      const userCollection = await dbUser();
      const filter = { _id: new ObjectId(_id) };
      const updateOperation = {};

      console.log({ description })
      if (!description) {
        throw { name: "RequiredInput", type: "Description" };
      } else {
        updateOperation.description = description;
      }

      // Update photo if file is provided
      if (req.files && req.files.photo) {
        console.log({ file: req.files, photo: req.files.photo }, "< nih brooo")
        const base64Convert = req.files.photo[0].buffer.toString("base64");
        const base64Url = `data:${req.files.photo[0].mimetype};base64,${base64Convert}`;
        const cloudinaryResponse = await cloudinary.uploader.upload(base64Url);
        updateOperation.photo = cloudinaryResponse.secure_url;
      }

      // Update thumbnail if file is provided
      if (req.files && req.files.thumbnail) {
        const base64Convert = req.files.thumbnail[0].buffer.toString("base64");
        const base64Url = `data:${req.files.thumbnail[0].mimetype};base64,${base64Convert}`;
        const cloudinaryResponse = await cloudinary.uploader.upload(base64Url);
        updateOperation.thumbnail = cloudinaryResponse.secure_url;
      }

      if (Object.keys(updateOperation).length === 0) {
        throw { name: "RequiredInput", type: "NoValidDataProvided" };
      }

      const updateProfile = await userCollection.updateOne(filter, { $set: updateOperation });

      console.log(updateProfile, "< === result")

      res.status(200).json({ message: "Profile updated successfully" });
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

  //   static async updatePhotoProfile(req, res, next) {
  //     try {
  //       const { _id } = req.user;
  //       const userCollection = await dbUser();
  //       const base64Convert = req.file.buffer.toString("base64");
  //       const base64Url = `data:${req.file.mimetype};base64,${base64Convert}`;
  //       const cloudinaryRespone = await cloudinary.uploader.upload(base64Url);
  //       const filter = { _id: new ObjectId(_id) };
  //       const updateOperation = {
  //         $set: { photo: cloudinaryRespone.secure_url },
  //       };
  //       const updateImg = await userCollection.updateOne(filter, updateOperation);
  //       res.status(200).json({ message: "Update image successfully" });
  //     } catch (error) {
  //       next(error);
  //     }
  //   }

  //   static async updateThumbnail(req, res, next) {
  //     try {
  //       const { _id } = req.user;

  //       const userCollection = await dbUser();
  //       const base64Convert = req.file.buffer.toString("base64");
  //       const base64Url = `data:${req.file.mimetype};base64,${base64Convert}`;
  //       const cloudinaryRespone = await cloudinary.uploader.upload(base64Url);
  //       const filter = { _id: new ObjectId(_id) };
  //       const updateOperation = {
  //         $set: { thumbnail: cloudinaryRespone.secure_url },
  //       };
  //       const updateThumbnail = await userCollection.updateOne(
  //         filter,
  //         updateOperation
  //       );
  //       res.status(200).json({ message: "Update thubmnail successfully" });
  //     } catch (error) {
  //       next(error);
  //     }
  //   }
  // }
}

module.exports = UserController;

// login -> username dan password

// register - >
