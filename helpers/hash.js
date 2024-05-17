const bcrypt = require("bcryptjs");

const hashedPass = (pass) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(pass, salt);
  return hash;
};

const verifPass = (pass, hashPass) => {
  return bcrypt.compareSync(pass, hashPass);
};

module.exports = {hashedPass, verifPass}
