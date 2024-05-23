const clearMissionTemplateCollection = async (db) => {
    const missionTemplateCollection = db.collection('Missions-Template');
    await missionTemplateCollection.deleteMany({});
  };
  
  module.exports = clearMissionTemplateCollection;
  