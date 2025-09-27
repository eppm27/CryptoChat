const mongoose = require('mongoose');
const { userDB } = require('../config/db');

/*
    Relationship: User -> has many -> Chats -> has many -> Messages
*/

const chatDB = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // for querying
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

const messageDB = new mongoose.Schema({
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

// Compound index for efficient chat message queries with sorting
messageDB.index({ chat: 1, createdAt: 1 });

module.exports = {
  Chat: userDB.model('Chat', chatDB),
  Message: userDB.model('Message', messageDB),
};
