// Define Schema for users
const mongoose = require('mongoose');
const { userDB } = require('../config/db');
const bcrypt = require('bcryptjs');

const cryptoBaseSchema = new mongoose.Schema({
  cryptoName: { type: String, required: true },
  cryptoSymbol: { type: String, required: true },
  cryptoId: { type: String, required: true },
});

const walletSchema = new mongoose.Schema({
  ...cryptoBaseSchema.obj,
  amount: { type: Number, required: true },
});

const watchlistSchema = new mongoose.Schema({
  ...cryptoBaseSchema.obj,
});

const userSchema = new mongoose.Schema({
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
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pfp: {
    type: String,
    default: '',
  },
  wallet: {
    type: [walletSchema],
    default: [],
  },
  savedPrompts: [
    {
      prompt: {
        type: String,
        required: true,
      },
    },
  ],
  watchlist: {
    type: [watchlistSchema],
    default: [],
  },
  searchHistory: [
    {
      prompt: {
        type: String, // The user's search query or prompt
        required: true,
      },
      response: {
        type: String,
      },
    },
  ],
});

// Hash password
userSchema.pre('save', async function (next) {
  // Only run this if the password was modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = userDB.model('User', userSchema);
