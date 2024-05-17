let jwt = require("jsonwebtoken");
const myToken = process.env.JWT_SECRET;
// console.log(myToken);
const signToken = (payload) => {
  return jwt.sign(payload, myToken);
};

const decodedToken = (token) => {
  return jwt.verify(token, myToken);
};

module.exports = { signToken, decodedToken };
