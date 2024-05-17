function onlyAdmin(req, res, next) {
  try {
    console.log(req.user, "<<< req user");
    const { role } = req.user;
    if (role && role !== "Admin") {
      throw { name: "NotAuth" };
    }
    next();
  } catch (error) {
    next(error);
  }
}

function onlyPlayer(req, res, next) {
  try {
    const { role } = req.user;
    if (role && role !== "User") {
      throw { name: "NotAuth" };
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { onlyAdmin, onlyPlayer };
