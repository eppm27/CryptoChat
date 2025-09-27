// Middleware function to verify JWT tokens

const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  const cookieToken = req.cookies?.token;
  const headerToken = req.headers.authorization?.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    // Only log for actual API calls, not health checks or preflight requests
    if (req.path !== '/health' && req.method !== 'OPTIONS') {
      console.log(`🔐 Auth failed for ${req.method} ${req.path}:`);
      console.log(`  - Cookie token: ${cookieToken ? 'present' : 'missing'}`);
      console.log(`  - Header token: ${headerToken ? 'present' : 'missing'}`);
      console.log(`  - All cookies:`, Object.keys(req.cookies || {}).join(', ') || 'none');
    }
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
