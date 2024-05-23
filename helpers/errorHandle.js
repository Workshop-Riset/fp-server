function errHandler(err, req, res, next) {
  let code = 500;
  let message = "Internal Server Error";
  console.log(err);

  if (
    err.name === "RequiredInput" ||
    err.name === "EmailFormat" ||
    err.name === "PasswordLength" ||
    err.name === "UniqueInput"
  ) {
    code = 400;

    if (err.name === "EmailFormat") {
      message = "Invalid email format";
    } else if (err.name === "PasswordLength") {
      message = "Password must be 6 characters";
    } else if (err.name === "UniqueInput") {
      message = `${err.type} is unique`;
    } else if (err.name === "RequiredInput") {
      message = `${err.type} is required`;
    }
  } else if (err.name === "InvAuth" || err.name === "AuthToken") {
    code = 401;
    message = "Invalid username or password";
  } else if (err.name === "NotAuth") {
    code = 403;
    message = 'You are not authorized';
  }

  res.status(code).json({ message });
}

module.exports = errHandler;
