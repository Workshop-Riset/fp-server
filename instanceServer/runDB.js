const getMongoClientInstance = require("./instance");

const dbName = "fd-db";

const runDb = async () => {
  const client = await getMongoClientInstance();
  const db = client.db(dbName);
  console.log("DB RUNNING JOSS");
  return db;
};

module.exports = runDb;
