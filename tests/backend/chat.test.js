const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../../backend/dbSchema/userSchema');

// Initialize express app first
const app = express();
app.use(express.json());

const mockUserId = new mongoose.Types.ObjectId();

// Mock the external services
jest.mock('../../backend/dbSchema/userSchema');
jest.mock('../../backend/dbSchema/chatSchema');
jest.mock('../../backend/services/llmService', () => ({
  processQuery: jest.fn((query) => {
    return Promise.resolve(`Dummy response for query: ${query}`);
  }),
}));
jest.mock('../../backend/services/graphService', () => ({
  processGraphsInResponse: jest.fn((respObj) => Promise.resolve(respObj)),
}));

// Mock auth middleware
jest.mock('../../backend/middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { _id: mockUserId };
    next();
  },
}));

// In-memory MongoDB server
let mongoServer;
let chatModel;
let messageModel;

// Define schemas directly in test file
const setupSchemas = () => {
  const chatSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      title: {
        type: String,
        default: 'New Chat',
      },
      lastMessage: {
        type: String,
        default: '',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true }
  );

  const messageSchema = new mongoose.Schema({
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'chatBot'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isError: Boolean,
    visualization: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isVisualization: {
      type: Boolean,
      default: false,
    },
  });

  return {
    Chat: mongoose.model('Chat', chatSchema),
    Message: mongoose.model('Message', messageSchema),
  };
};

const chatRoutes = require('../../backend/routes/chatRoutes');

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  // Setup schemas and models
  const models = setupSchemas();
  chatModel = models.Chat;
  messageModel = models.Message;

  app.use(bodyParser.json());
  app.use('/api/chat', chatRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  //   jest.clearAllMocks();
  await chatModel.deleteMany({});
  await messageModel.deleteMany({});
});

describe('Chat Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('createChat', () => {
    it('should create a new chat', async () => {
      User.findById.mockResolvedValue({ _id: mockUserId });

      const response = await request(app)
        .post('/api/chat')
        .send({ content: 'Test content' });

      expect(response.status).toBe(201);
    });

    it('should return 401 if user is not authenticated', async () => {
      const testApp = express();
      testApp.use(express.json());

      // Use the actual `chatRoutes` without mocking the authentication middleware
      const originalAuthMiddleware = jest.requireActual(
        '../../backend/middleware/authMiddleware'
      );
      testApp.use('/api/chat', [
        originalAuthMiddleware.verifyToken,
        chatRoutes,
      ]);

      const response = await request(testApp)
        .post('/api/chat')
        .send({ content: 'Test content' });

      expect(response.status).toBe(401);
    });
  });

  describe('deleteChat', () => {
    it('should only allow owner to delete chat', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const testChat = await chatModel.create({
        user: ownerId,
        title: 'To be deleted',
      });

      // Mock that the authenticated user is the owner
      User.findById.mockResolvedValueOnce({ _id: ownerId });

      const response = await request(app).delete(`/api/chat/${testChat._id}`);
      expect(response.status).toBe(404);
    });
  });
});
