const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Unauthorized." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const requireOwner = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Access denied. Owner only." });
  }
  next();
};

const requireTenant = (req, res, next) => {
  if (req.user.role !== "tenant") {
    return res.status(403).json({ message: "Access denied. Tenant only." });
  }
  next();
};

module.exports = { verifyToken, requireOwner, requireTenant };
