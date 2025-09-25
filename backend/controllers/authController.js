const jwt = require('jsonwebtoken');
const User = require('../dbSchema/userSchema');
const {
  transporter,
  getPasswordResetURL,
  resetPasswordTemplate,
} = require('../services/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Register Controller
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ firstName, lastName, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: 'strict',
      maxAge: 3600000, // 1 hr JWT expiry
    });
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check inputs
    if (!(email && password)) {
      return res.status(400).json({ message: 'All input is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: 'strict',
      maxAge: 3600000, // 1 hr JWT expiry
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Logout controller
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

//// Password reset controllers ////

// Generate reset token, save to user
const generateResetToken = async (req, res) => {
  try {
    const { email } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'no such user' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);

    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetURL = getPasswordResetURL(user, token);
    const emailTemplate = resetPasswordTemplate(user, resetURL);

    console.log('Sending email to:', user.email);
    await transporter.sendMail(emailTemplate);
    console.log('Email sent successfully!');

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Email send error:', error);
    res
      .status(500)
      .json({ message: 'Error sending reset email', error: error.message });
  }
};

// Verify token and allow password reset
const verifyResetToken = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const user = await User.findOne({
      _id: userId,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Password reset token is invalid or has expired' });
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: 'Password reset token is invalid or has expired' });
    }

    res.status(200).json({ message: 'Token verified', userId });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error verifying token', error: error.message });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { userId, token, password } = req.body;

    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() },
    });

    // 2. Verify token matches (bcrypt comparison)
    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValidToken) {
      return res.status(400).json({
        message: 'Invalid password reset token',
      });
    }

    // Hash new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating password', error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  generateResetToken,
  verifyResetToken,
  updatePassword,
};
