const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URI;
// console.log(process.env, '<<<<<');
let client = new MongoClient(uri);
async function getMongoClientInstance() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

module.exports = getMongoClientInstance;
