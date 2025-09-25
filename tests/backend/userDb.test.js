const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

// User Schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  searchHistory: [
    {
      prompt: String,
      response: String,
    },
  ],
});

// Add pre-save hook for password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Add password comparison method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create model
const User = mongoose.model("User", UserSchema);

// Tests
describe("User Database Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Disconnect and stop the in-memory server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database between tests
    await User.deleteMany({});
  });

  it("should establish database connection", () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it("should save and retrieve a user", async () => {
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
    };

    const user = new User(testUser);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(testUser.email);
    expect(savedUser.password).not.toBe(testUser.password); // Should be hashed

    const foundUser = await User.findOne({ email: testUser.email });
    expect(foundUser.firstName).toBe(testUser.firstName);
    expect(foundUser.lastName).toBe(testUser.lastName);
  });

  it("should compare passwords correctly", async () => {
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
    };

    const user = new User(testUser);
    await user.save();

    const isMatch = await user.comparePassword("password123");
    const isWrongMatch = await user.comparePassword("wrongpassword");

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });
});
