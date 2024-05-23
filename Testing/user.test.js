const request = require('supertest');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const clearUsersCollection = require('../helpers/clearUser');  // Pastikan path sesuai

let connection;
let db;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  connection = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = connection.db();
  require('../controllers/UserController').dbUser = jest.fn().mockResolvedValue(db.collection('Users'));
});

afterAll(async () => {
  await connection.close();
  await mongoServer.stop();
});

describe('UserController', () => {
  let userToken;
  let testUserId;

  describe('POST /user/register', () => {
    afterEach(async () => {
      await clearUsersCollection(db);
    });

    test('should register a new user successfully', async () => {
        const body = {
          name: 'Test User',
          email: 'testuser123@example.com',
          phoneNumber: '08123456789',
          username: 'ampunom1',
          password: '222222',
          category: 'adult',
        };
  
        const response = await request(app).post('/user/register').send(body);
        expect(response.status).toBe(201);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body).toHaveProperty('message', 'Registration Successfully');
        expect(response.body.data).toMatchObject({
          name: body.name,
          email: body.email,
          phoneNumber: body.phoneNumber,
          username: body.username,
          category: body.category,
        });
  
        testUserId = response.body.data._id; 
      });

    test('should return 400 if email is invalid', async () => {
      const body = {
        name: 'Test User',
        email: 'invalid-email',
        phoneNumber: '08123456789',
        username: 'testuser',
        password: 'password123',
        category: 'test category',
      };
    
      const response = await request(app).post('/user/register').send(body);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });
  });

  describe('POST /user/login', () => {
    test('should login successfully and return an access token', async () => {
      const body = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app).post('/user/login').send(body);
      console.error('Login response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object)
      expect(response.body).toHaveProperty('access_token',  expect.any(String));
      userToken = response.body.access_token;
    });

    test('should return 400 if username is not found', async () => {
        const body = {
          username: 'nonexistentuser',
          password: 'password123',
        };
  
        const response = await request(app).post('/user/login').send(body);
        expect(response.status).toBe(401); 
        expect(response.body).toHaveProperty('message', 'Invalid username or password');
      });
      
      test('should return 401 if password is incorrect', async () => {
        const body = {
          username: 'testuser',
          password: 'wrongpassword',
        };
      
        const response = await request(app).post('/user/login').send(body);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.status).toBe(401); 
        expect(response.body).toHaveProperty('message', 'Invalid username or password');
      });
      
  });

  describe('GET /user/my-profile', () => {
    test('should get the user profile', async () => {
      const response = await request(app)
        .get('/user/my-profile')
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
    });
  });

  describe('PATCH /user/description', () => {
    test('should update the user description', async () => {
      const body = {
        description: 'This is a test description.',
      };

      const response = await request(app)
        .patch('/user/description')
        .send(body)
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Description updated successfully');
    });
  });

  describe('GET /user/:userId', () => {
    test('should get the user information by userId', async () => {
        const response = await request(app)
          .get(`/user/${testUserId}`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('username', 'testuser');
      });      
  });

  describe('GET /user/rank-user', () => {
    test('should get the ranked users', async () => {
        const response = await request(app)
          .get('/user/rank-user')
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
      });      
  });

  describe('PATCH /user/my-profile', () => {
    test('should update the user profile photo', async () => {
        const response = await request(app)
          .patch('/user/my-profile')
          .attach('image', Buffer.from('dummy_image_data'), 'photo.png') 
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Update image successfully');
      });      
  });

  describe('PATCH /user/my-thumbnail', () => {
    test('should update the user profile thumbnail', async () => {
        const response = await request(app)
          .patch('/user/my-thumbnail')
          .attach('thumbnail', Buffer.from('dummy_image_data'), 'thumbnail.png')
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(500); 
        expect(response.body).toHaveProperty('message', 'Internal Server Error'); 
      });
  });
});
