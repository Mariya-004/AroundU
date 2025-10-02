const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Get token from the standard Authorization header
  const authHeader = req.header('Authorization');

  // 2. Check if header exists and is in the correct format ('Bearer <token>')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token or invalid format, authorization denied' });
  }

  try {
    // 3. Extract the token from 'Bearer <token>'
    const token = authHeader.split(' ')[1];

    // 4. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;