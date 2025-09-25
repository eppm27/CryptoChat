// Testing Cases - (notes from meeting, these tests should go somewhere else...)
//      Test searching multiple different things
//          (e.g., general crypto, specific crypto, etc).
//          Does it use the correct API data
//      Test if correct referencing
//          Legitimate referencing and not made up nonsense

// Using jest.mock as these are unit tests.
// Though mongob-memory-server makes a hybrid technically
const mongoose = require('mongoose');
const APIService = require('../../backend/services/APIService');
const DataModel = require('../../backend/dbSchema/dbSchema');
const {
  populateEmptyDatabase,
  updateData,
} = require('../../backend/controllers/APIController');
const { MongoMemoryServer } = require('mongodb-memory-server');

// delete process.env.MONGODB_URI;
// The database that is used during these tests
let mongoServer;

describe.skip('API Controller Unit (Hybrid) Tests', () => {
  beforeAll(async () => {
    // Starting the database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Using mongoose to connect to database
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clearing the database
    await DataModel.deleteMany({});
  });

  // 1. Testing an empty database and updateAllData function
  describe.skip('Test updateAllData with empty database', () => {
    it('populates an empty database', async () => {
      // Javascript has default timeout of 5000 = 5 seconds
      // Adding manual timeout for testing until efficiencies resolves
      jest.setTimeout(15000);

      // Check that database is empty
      const anyEntry = await DataModel.findOne();
      expect(anyEntry).toBeNull();

      await populateEmptyDatabase();

      // Check it has been populated
      const anEntry = await DataModel.findOne();
      expect(anEntry).not.toBeNull();
    });
  });

  // 2. Testing a specific API call
  describe('Testing a specific API call', () => {
    it('fetches API from a specific source', async () => {
      // Mock fetchCryptoData() with a specific source
      jest
        .spyOn(APIService, 'fetchCryptoData')
        .mockResolvedValue([{ source: 'Test API', data: { value: 123 } }]);

      const data = await APIService.fetchCryptoData('Test API');
      expect(data).toEqual([{ source: 'Test API', data: { value: 123 } }]);
    });
  });

  // 3. Testing data persistence
  describe('Test data persistence', () => {
    it('no populating if not empty', async () => {
      // Making sure database is not empty
      await populateEmptyDatabase();

      // Check if data is populated
      const count = await DataModel.countDocuments();
      expect(count).toBeGreaterThan(0);

      // Try to populate again and check that the count doesn't change
      await populateEmptyDatabase();
      const newCount = await DataModel.countDocuments();
      expect(newCount).toBe(count);
    });
  });

  // 4. Testing invalid API requests
  describe('Test invalid API requests', () => {
    it('no invalid API calls', async () => {
      // Mock fetchCryptoData() with invalid source
      jest
        .spyOn(APIService, 'fetchCryptoData')
        .mockRejectedValue(new Error('API not found'));

      await expect(APIService.fetchCryptoData('Invalid API')).rejects.toThrow(
        'API not found'
      );
    });
  });

  // 5. Testing updateData function
  describe('Test updateData function', () => {
    it('updates/inserts data correctly', async () => {
      // Mock fetchCryptoData for test data
      jest
        .spyOn(APIService, 'fetchCryptoData')
        .mockResolvedValue([{ source: 'Mock API', data: { value: 456 } }]);

      // Mocking the data
      const req = { body: { source: 'Mock API' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateData(req, res);

      // Check if the database now contains the new data
      const dbEntry = await DataModel.findOne({ source: 'Mock API' });

      // Assertions
      expect(dbEntry).not.toBeNull(); // Data should be inserted
      expect(dbEntry.data).toEqual({ value: 456 }); // Data should match mock response
      expect(res.status).toHaveBeenCalledWith(200); // Expect a successful response
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Crypto data from Mock API updated successfully!',
          updated: expect.objectContaining({ source: 'Mock API' }),
        })
      );
    });

    it('returns an error if no source is provided', async () => {
      const req = { body: {} }; // No source
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateData(req, res);

      // Expect 400 error for missing source
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Source is required' });
    });

    it('returns an error if the API returns nothing', async () => {
      jest.spyOn(APIService, 'fetchCryptoData').mockResolvedValue([]); // No data

      const req = { body: { source: 'Invalid API' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateData(req, res);

      // Expect 404 error when no data is found
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nothing found' });
    });
  });

  afterAll(async () => {
    // Disconnecting from the database
    await mongoose.disconnect();
    await mongoServer.stop();
  });
});
