const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  generateResetToken,
  verifyResetToken,
  updatePassword,
} = require('../controllers/authController.js');

// Register Route
router.post("/register", register);

// Login Route
router.post("/login", login);

// Logout Route
router.post("/logout", logout);

// Reset password routes
router.post('/password/reset', generateResetToken);
router.get('/password/reset/:userId/:token', verifyResetToken);
router.post('/password/update', updatePassword);

module.exports = router;
