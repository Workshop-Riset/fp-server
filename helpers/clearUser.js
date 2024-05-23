const clearUsersCollection = async (db) => {
    const userCollection = db.collection('Users');
    await userCollection.deleteMany({});
  };
  
  module.exports = clearUsersCollection;
  