// set up MongoDB connection

const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

// Connection to the MongoDB Atlas cluster
let userDB, financialDataDB, cryptoListDB;
if (process.env.MONGODB_URI) {
  const connectDB = mongoose.createConnection(process.env.MONGODB_URI);

  connectDB.on("connected", () => console.log("MongoDB connected"));
  connectDB.on("error", (err) => {
    console.error("Main MongoDB connection error:", err);
    process.exit(1);
  });
  // Switch to specific databases
  userDB = connectDB.useDb("user");
  financialDataDB = connectDB.useDb("financialData");
  cryptoListDB = connectDB.useDb("cryptoListDB");
} else {
  // For tests use mongoose directly without creating a new connection
  userDB = mongoose;
  financialDataDB = mongoose;
  cryptoListDB = mongoose;
}

module.exports = { userDB, financialDataDB, mongoose, cryptoListDB };
