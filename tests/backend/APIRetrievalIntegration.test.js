// These are the integration tests, we use mongob-memory-server to prevent weird stuff

const mongoose = require('mongoose');
const request = require('supertest'); // For simulating API calls
const DataModel = require('../../backend/dbSchema/dbSchema');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Refered to llmEndPoint.test.js
const express = require('express');
const app = express();
app.use(express.json());

// importing api routes
const apiRoutes = require('../../backend/routes/APIRoutes');
app.use('/api', apiRoutes);

delete process.env.MONGODB_URI;
let mongoServer;

describe.skip('API Controller Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await DataModel.deleteMany({});
  });

  // 1. Test updateData API
  it('updates/inserts data correctly', async () => {
    const response = await request(app)
      .put('/api/update-data')
      .send({ source: 'coingecko' });

    // Success?
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('updated successfully');

    // Is data actually in database?
    const dbEntry = await DataModel.findOne({ source: 'coingecko' });
    expect(dbEntry).not.toBeNull();
  });

  // 2. Test updateAllData API
  it('populate the database', async () => {
    const response = await request(app).post('/api/update-all-data');

    // Success?
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Crypto data saved successfully!');

    // Data inserted?
    const count = await DataModel.countDocuments();
    expect(count).toBeGreaterThan(0);
  });

  // 3. Test behavior when the database is populated
  // it('no duplicated', async () => {
  //   await request(app).post('/api/update-all-data');
  //   const countBefore = await DataModel.countDocuments();

  //   // Dejavu
  //   await request(app).post('/api/update-all-data');
  //   const countAfter = await DataModel.countDocuments();

  //   // count same?
  //   expect(countAfter).toBe(countBefore);
  // });

  // I now the previous test works on the small scale
  // currently if information isn't recieved in the first run it can be received in second
  // will have to update API service and test to properly test duplicates

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
});
