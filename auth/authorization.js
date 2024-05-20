const { decodedToken } = require("../helpers/jwt");
const { findIdUser } = require("../helpers/userHelpers");

async function authorization(req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      throw { name: "AuthToken", message: "Invalid Token", type: "Inv" };
    }
    const token = authorization.split(" ")[1];
    const decode = decodedToken(token);
    const findId = await findIdUser(decode._id);
    if (!findId) {
      throw { name: "AuthToken", message: "Invalid Token", type: "Inv" };
    }
    req.user = decode;
    console.log(req.user, '<<<<');
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
}

module.exports = authorization;
