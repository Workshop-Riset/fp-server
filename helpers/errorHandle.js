function errHandler(err, req, res, next) {
  let code = 500;
  let message = "Internal Server Error";
  console.log(err.name);
  if (
    err.name === "RequiredInput" ||
    err.name === "EmailFormat" ||
    err.name === "PasswordLength" ||
    err.name === "UniqueInput"
  ) {
    code = 400;

    if (!err.type) {
      if (err.name === "EmailFormat") {
        message = "Email is invalid format";
      } else if (err.name === "PasswordLength") {
        message = "Password must be 6 characthers";
      }
    }
    if (err.name === "UniqueInput") {
      message = `${err.type} is unique`;
    }
  } else if (err.name === "InvAuth" || err.name === "AuthToken") {
    code = 401;
    if (!err.type) {
      message = "Invalid username/password";
    }
    message = err.message;
  }
  res.status(code).json({ message });
}

module.exports = errHandler;