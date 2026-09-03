const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  // Guard against empty token string
  if (!token || token.length < 10) {
    return res.status(401).json({ message: 'Not authorized, malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],           // explicit algorithm pin — prevent "alg: none" attack
      issuer:     'technova-api',      // must match token issuer
      audience:   'technova-client',  // must match token audience
    });

    // Only attach the fields we need — never the full decoded payload
    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name,
      role:  decoded.role,
    };
    next();
  } catch (err) {
    // Distinguish expired from invalid so the client can prompt for re-login
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please sign in again' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
