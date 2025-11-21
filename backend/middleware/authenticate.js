const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access Denied. No Token Provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKey");

    // Attach in consistent format
    req.user = { _id: decoded.userId };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;
