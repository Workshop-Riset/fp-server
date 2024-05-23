const routes = require("express").Router();
const authorization = require("../auth/authorization");
const UserController = require("../controllers/UserController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

routes.get("/", UserController.getUser);
routes.post("/register", UserController.register);
routes.post("/login", UserController.login);
routes.get("/my-profile", authorization, UserController.myProfile);
// routes.patch("/description", authorization, UserController.updateDescription);
// routes.patch(
//   "/my-profile",
//   authorization,
//   upload.single("image"),
//   UserController.updatePhotoProfile
// );
// routes.patch(
//     "/my-thumbnail",
//     authorization,
//     upload.single("image"),
//     UserController.updateThumbnail
// )

routes.patch(
  "/update-profile",
  authorization,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  UserController.updateProfile
);


routes.get("/:userId", UserController.informationUserOther);

module.exports = routes;
