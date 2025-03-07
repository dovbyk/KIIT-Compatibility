const request = require('supertest');
const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const app = require('../server');
const User= require('../models/User');

let mongoServer;

beforeAll(async () =>{
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () =>{
  await User.deleteMany({});
});

describe('Auth API', () => {
  it('POST /api/auth/register - should register a new user', async () =>{
    const res=await request(app)
    .post('/api/auth/register')
    .send({
      username: 'testuser1',
      email: 'test1@kiit.ac.in',

      password: 'password123',
      phoneNumber: '9876543210'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    const user = await User.findOne({ email: 'test1@kiit.ac.in'});
    expect(user).toBeTruthy();
  });

  it('POST /api/auth/register - should fail with duplicate email', async () => {
    await new User({
      username: 'testuser1',
      email: 'test1@kiit.ac.in',
      password: 'password123',
      phoneNumber: '9876543210'
    }).save();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test1@kiit.ac.in',
        password: 'password123',
        phoneNumber: '1234567890'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('User already exists');
  });

  it('POST /api/auth/login - should login existing user', async () => {
    const user = new User({
      username: 'testuser1',
      email: 'test1@kiit.ac.in',
      password: await require('bcryptjs').hash('password123', 10),
      phoneNumber: '9876543210'
    });
    await user.save();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test1@kiit.ac.in', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    const updatedUser = await User.findOne({ email: 'test1@kiit.ac.in' });
    expect(updatedUser.isOnline).toBe(true);
  });

  it('POST /api/auth/logout - should logout user', async () => {
    const user = new User({
      username: 'testuser1',
      email: 'test1@kiit.ac.in',
      password: await require('bcryptjs').hash('password123', 10),
      phoneNumber: '9876543210',
      isOnline: true
    });
    await user.save();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test1@kiit.ac.in', password: 'password123' });
    const token = loginRes.body.token;
    const res = await request(app)
      .post('/api/auth/logout')
      .set('x-auth-token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Logged out successfully');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isOnline).toBe(false);
  });
});

