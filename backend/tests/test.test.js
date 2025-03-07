const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Test API', () => {
  let token1, token2, user1Id, user2Id;

  beforeEach(async () => {
    // Register and login testuser1
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser1', email: 'test1@kiit.ac.in', password: 'password123', phoneNumber: '9876543210' });
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test1@kiit.ac.in', password: 'password123' });
    token1 = res1.body.token;
    user1Id = (await User.findOne({ email: 'test1@kiit.ac.in' }))._id;

    // Register and login testuser2
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', email: 'test2@kiit.ac.in', password: 'password123', phoneNumber: '1234567890' });
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test2@kiit.ac.in', password: 'password123' });
    token2 = res2.body.token;
    user2Id = (await User.findOne({ email: 'test2@kiit.ac.in' }))._id;
  });

  it('POST /api/test - should submit answers', async () => {
    const res = await request(app)
      .post('/api/test')
      .set('x-auth-token', token1)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "A", "4": "A", "5": "A", "6": "A", "7": "A", "8": "A", "9": "A" } });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Answers submitted succesfully');
    const user = await User.findById(user1Id);
    expect(user.answers.size).toBe(10);
  });

  it('GET /api/users - should list online users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-auth-token', token1);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ username: 'testuser1' }),
      expect.objectContaining({ username: 'testuser2' })
    ]));
  });

  it('POST /api/compatibility - should calculate score', async () => {
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token1)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "A", "4": "A", "5": "A", "6": "A", "7": "A", "8": "A", "9": "A" } });
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token2)
      .send({ answers: { "0": "A", "1": "A", "2": "B", "3": "B", "4": "A", "5": "A", "6": "B", "7": "B", "8": "A", "9": "B" } });
    const res = await request(app)
      .post('/api/compatibility')
      .set('x-auth-token', token1)
      .send({ targetUserId: user2Id });
    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBe(60);
  });

  it('POST /api/request - should send request if score > 50', async () => {
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token1)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "A", "4": "A", "5": "A", "6": "A", "7": "A", "8": "A", "9": "A" } });
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token2)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "B", "4": "A", "5": "A", "6": "A", "7": "B", "8": "A", "9": "A" } });
    const res = await request(app)
      .post('/api/request')
      .set('x-auth-token', token1)
      .send({ targetUserId: user2Id, score: 80 });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Request send');
  });

  it('POST /api/approve - should approve request', async () => {
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token1)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "A", "4": "A", "5": "A", "6": "A", "7": "A", "8": "A", "9": "A" } });
    await request(app)
      .post('/api/test')
      .set('x-auth-token', token2)
      .send({ answers: { "0": "A", "1": "A", "2": "A", "3": "B", "4": "A", "5": "A", "6": "A", "7": "B", "8": "A", "9": "A" } });
    await request(app)
      .post('/api/request')
      .set('x-auth-token', token1)
      .send({ targetUserId: user2Id, score: 80 });
    const res = await request(app)
      .post('/api/approve')
      .set('x-auth-token', token2)
      .send({ requesterId: user1Id, approved: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.phoneNumber).toBe('1234567890');
  });
});
