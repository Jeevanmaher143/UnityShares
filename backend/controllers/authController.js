const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ===================== SIGNUP =====================
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ===================== LOGIN =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id },                 // IMPORTANT
      process.env.JWT_SECRET,
      { expiresIn: "7d" }                   // 7 days
    );

    res.status(200).json({
      message: "Login successful",
      token,
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
