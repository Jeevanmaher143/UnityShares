// server.js (clean + fixed)
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
require("dotenv").config();

const User = require("./models/users");
const Donation = require("./models/Donation");

const authenticate = require("./middleware/authenticate");
const donationRoutes = require("./routes/donationRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Multer Storage (For Donation Upload)
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// =============================
// Create Donation
// =============================
app.post("/donate", upload.array("images", 5), async (req, res) => {
  try {
    const { resourceName, quantity, category, description, location, userId } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imagePaths = req.files.map((f) => `/uploads/${f.filename}`);

    const donation = new Donation({
      resourceName,
      quantity,
      category,
      description,
      location,
      image: imagePaths,
      userId,
    });

    await donation.save();

    res.status(201).json({ message: "Donation successful", donation });
  } catch (err) {
    console.error("Error in /donate:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// Get All Donated Resources
// =============================
app.get("/donatedResources", async (req, res) => {
  try {
    const donated = await Donation.find()
      .populate("userId", "name email")
      .lean();

    res.json(donated);
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// User Profile Route (FIXED)
// Donor sees requester name, requester sees donation status
// =============================
app.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // All resources donated by user
    const donatedResources = await Donation.find({ userId })
      .populate("requestedBy.userId", "name email")
      .lean();

    // All resources where this user has requested
    const requestedResources = await Donation.find({
      "requestedBy.userId": userId,
    })
      .populate("requestedBy.userId", "name email")
      .lean();

    res.json({
      name: user.name,
      donatedResources,
      requestedResources,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// Donation Routes (Request / Accept / Complete)
// =============================
app.use("/", donationRoutes);

// =============================
// Authentication Routes (Login / Signup)
// =============================
app.use("/", authRoutes);

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
