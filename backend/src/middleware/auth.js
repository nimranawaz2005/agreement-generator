const jwt = require('jsonwebtoken');

// Middleware to verify if the user is logged in (Authentication)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token || req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Save user data (id, role, companyId) to the request
    next(); // Let the user proceed to the API route
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

// Middleware to verify if the user is an Admin (Authorization)
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Access restricted. Admin permissions required." });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };