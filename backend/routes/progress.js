const express = require('express');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user's progress
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const progress = await Progress.find({ user: req.user._id });
    res.json({ progress, user: { points: user.points, quizzesTaken: user.quizzesTaken, streakDays: user.streakDays } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save quiz result
router.post('/quiz-result', protect, async (req, res) => {
  try {
    const { subject, score, totalQuestions, topic, difficulty } = req.body;

    let progress = await Progress.findOne({ user: req.user._id, subject });
    if (!progress) {
      progress = new Progress({ user: req.user._id, subject });
    }

    progress.quizResults.push({ score, totalQuestions, topic, difficulty });
    await progress.save();

    const pointsEarned = Math.round((score / totalQuestions) * 10);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: pointsEarned, quizzesTaken: 1 },
    });

    res.json({ message: 'Progress saved', pointsEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Log study session
router.post('/study-session', protect, async (req, res) => {
  try {
    const { subject, duration, topicsCovered } = req.body;
    let progress = await Progress.findOne({ user: req.user._id, subject });
    if (!progress) progress = new Progress({ user: req.user._id, subject });

    progress.studySessions.push({ duration, subject, topicsCovered });
    progress.weeklyProgress += duration / 60;
    await progress.save();
    res.json({ message: 'Session logged' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;