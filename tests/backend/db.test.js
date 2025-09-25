const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Define the schema 
const dataSchema = new mongoose.Schema({
  source: { type: String, required: true },
  sentimentMetric: {
    type: String,
    enum: ['sentiment', 'metric'],
    required: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  topic: { type: [String], required: true },
  date_updated: { type: Date, default: Date.now },
});

const Data = mongoose.model('Data', dataSchema);

describe('Database Connection', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start the in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri(); 
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Disconnect and stop the server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear the database between tests
    await Data.deleteMany({});
  });

  it('should establish database connection', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should insert and find data', async () => {
    const mockData = {
      source: 'coingecko',
      sentimentMetric: 'metric',
      data: { bitcoin: { usd: 12345 } },
      topic: ['crypto'],
    };

    await Data.create(mockData);
    const foundData = await Data.findOne({ source: 'coingecko' });

    expect(foundData).toBeDefined();
    expect(foundData.source).toBe('coingecko');
  });
});
