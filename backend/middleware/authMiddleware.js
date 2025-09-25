// Middleware function to verify JWT tokens

const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No token in Bearer format');
    return res.status(401).json({ message: 'Unauthorized - token err' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId };
    console.log('Setting userId:', req.user._id);
    next();
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };
