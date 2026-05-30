const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const bcrypt = require("bcryptjs");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await require("bcryptjs").hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = require("jsonwebtoken").sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbacksecret"
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        isAssessmentDone: false,
      },
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err); // 🔥 MUST SEE THIS
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = require("jsonwebtoken").sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbacksecret"
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        isAssessmentDone: user.isAssessmentDone || false,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err); // 🔥 THIS IS KEY
    res.status(500).json({ message: "Server error" });
  }
});
/*router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: generateToken(user._id), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});*/

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN DATA:", req.body); // debug

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        isAssessmentDone: user.isAssessmentDone || false,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err); // 👈 IMPORTANT
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;