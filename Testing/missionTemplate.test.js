const request = require("supertest");
const { MongoClient, ObjectId } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const clearMissionTemplateCollection = require("../helpers/clearMissionTemplate");
const { signToken } = require("../helpers/jwt");

let connection;
let db;
let mongoServer;
let accessToken;
let fakeToket = `Bearer anjing anjing anjing anjing`
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  connection = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = connection.db();
  require("../controllers/MissionTemplateController").dbUser = jest
    .fn()
    .mockResolvedValue(db.collection("Missions-Template"));

  const testUser = {
    username: "admin1",
    role: "Admin",
    _id: new ObjectId("66463c59edc93d7c3e96b61d"),
  };
  accessToken = signToken(testUser);
  console.log(accessToken, '<<<<<< masuk pepek');
  //   console.log(accessToken,'tokenbwang');

});

afterAll(async () => {
  await connection.close();
  await mongoServer.stop();
});

describe("MissionTemplate", () => {
  describe("GET /missions", () => {
    beforeEach(async () => {
      await clearMissionTemplateCollection(db);
    });

    test("should get all missions successfully", async () => {
      const response = await request(app).get("/mission-template");
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe("POST /mission-template", () => {
    afterEach(async () => {
      await clearMissionTemplateCollection(db);
    });

    test("Should create a new entity successfully", async () => {
      const bodyDalam = {
        name: "Test Mission",
        description: "This is a test mission",
        point: 10,
        location: "123, 456",
        thumbnail: "thumbnail.jpg",
        type: "type1",
        category: "category1",
        city: "Surabaya",
      };

      const response = await request(app)
        .post("/mission-template")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(bodyDalam);
      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("name", bodyDalam.name);
      expect(response.body).toHaveProperty(
        "description",
        bodyDalam.description
      );
      expect(response.body).toHaveProperty("point", bodyDalam.point);
      expect(response.body).toHaveProperty("location", bodyDalam.location);
      expect(response.body).toHaveProperty("thumbnail", bodyDalam.thumbnail);
      expect(response.body).toHaveProperty("type", bodyDalam.type);
      expect(response.body).toHaveProperty("category", bodyDalam.category);
      expect(response.body).toHaveProperty("city", bodyDalam.city);
    });

    test("should return 401 if required fields are missing", async () => {
      const body = {
        name: "Test Mission",
      };

      const response = await request(app)
        .post("/mission-template")
        .send(body);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", response.body.message);
    });
  });
});
