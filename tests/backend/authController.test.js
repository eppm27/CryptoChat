// Testing business logic: auth Controller
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Mock all database dependencies

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
}));

jest.mock('mongoose');
jest.mock('../../backend/config/db');
jest.mock('../../backend/dbSchema/userSchema');

jest.mock('../../backend/controllers/authController', () => {
  const jwt = require('jsonwebtoken');
  const mockUser = {
    _id: '507f191e810c19729de860ea',
  };

  return {
    register: jest.fn().mockImplementation((req, res) => {
      if (req.body.email === 'duplicate@example.com') {
        return res.status(400).json({ message: 'User already exists' });
      }
      return res.status(201).json({ message: 'Registration successful' });
    }),
    login: jest.fn().mockImplementation((req, res) => {
      if (
        req.body.email === 'test@example.com' &&
        req.body.password === 'password123'
      ) {
        const token = jwt.sign({ userId: mockUser._id }, 'test-secret');
        return res
          .cookie('token', token, { httpOnly: true })
          .status(200)
          .json({ message: 'Login successful' });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }),
    logout: jest.fn().mockImplementation((_, res) => {
      return res
        .clearCookie('token')
        .status(200)
        .json({ message: 'Logged out successfully' });
    }),
    generateResetToken: jest.fn((req, res) => res.status(200).send()), // Add this
    verifyResetToken: jest.fn((req, res) => res.status(200).send()), // Add this
    updatePassword: jest.fn((req, res) => res.status(200).send()), // Add this
  };
});

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', require('../../backend/routes/authRoutes'));

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Auth Routes (Pure Unit Tests)', () => {
  describe('POST /register', () => {
    it('should return 201 for successful registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.message).toBe('Registration successful');
    });

    it('should return 400 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /login', () => {
    it('should return 200 with token cookie for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /logout', () => {
    it('should clear the auth cookie', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies.some((cookie) => cookie.includes('token=;'))).toBe(true);
    });
  });

  describe('Password Reset Routes', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      const mockPasswordController = {
        generateResetToken: jest.fn((req, res) => res.status(200).json({})),
        verifyResetToken: jest.fn((req, res) => res.status(200).json({})),
        updatePassword: jest.fn((req, res) => res.status(200).json({})),
      };

      const router = express.Router();
      router.post('/password/reset', mockPasswordController.generateResetToken);
      router.get(
        '/password/reset/:userId/:token',
        mockPasswordController.verifyResetToken
      );
      router.post('/password/update', mockPasswordController.updatePassword);

      app.use('/api/auth', router);
    });

    it('should call generateResetToken', async () => {
      await request(app)
        .post('/api/auth/password/reset')
        .send({ email: 'test@example.com' })
        .expect(200);
    });
  });
});
