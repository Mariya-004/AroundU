const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Log the start of the middleware execution
  console.log('[AUTH] Middleware started.');

  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Denied. No token or invalid format.');
    return res.status(401).json({ msg: 'No token or invalid format, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];

    // 2. Explicitly check and log if the environment variable is loaded
    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] CRITICAL ERROR: JWT_SECRET environment variable is not set!');
      return res.status(500).json({ msg: 'Server configuration error: Missing JWT secret.' });
    }

    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request

    console.log(`[AUTH] Token verified successfully for user: ${req.user.id}, role: ${req.user.role}`);
    next(); // Proceed to the next middleware/route handler

  } catch (err) {
    // 4. Log the specific reason for token invalidity
    console.error('[AUTH] Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;

