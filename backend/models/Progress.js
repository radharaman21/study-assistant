const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    quizResults: [
      {
        score: Number,
        totalQuestions: Number,
        topic: String,
        date: { type: Date, default: Date.now },
        difficulty: String,
      },
    ],
    studySessions: [
      {
        duration: Number, // in minutes
        subject: String,
        date: { type: Date, default: Date.now },
        topicsCovered: [String],
      },
    ],
    weeklyGoal: { type: Number, default: 10 }, // hours
    weeklyProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);