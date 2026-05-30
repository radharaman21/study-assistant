const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/submit', protect, async (req, res) => {
  try {
    const {
      studyHoursPerDay,
      learningLevel,
      course,
      preferredLanguage,
      subjects,
      learningPace,
    } = req.body;

    if (!course || !subjects || subjects.length === 0) {
      return res.status(400).json({
        message: 'Course and subjects are required',
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'profile.studyHoursPerDay': studyHoursPerDay,
      'profile.learningLevel': learningLevel,
      'profile.course': course,
      'profile.preferredLanguage': preferredLanguage,
      'profile.subjects': subjects,
      'profile.learningPace': learningPace,
      isAssessmentDone: true,
    });

    const studyPlan = generateBasicStudyPlan({
      studyHoursPerDay,
      subjects,
      learningPace,
    });

    await User.findByIdAndUpdate(req.user._id, {
      studyPlan,
    });

    const updatedUser = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Assessment saved successfully',
      user: updatedUser,
    });

  } catch (err) {
    console.error('Assessment ERROR:', err);

    res.status(500).json({
      success: false,
      message: err.message || 'Failed to save assessment',
    });
  }
});

function generateBasicStudyPlan({
  studyHoursPerDay = 2,
  subjects = [],
  learningPace = 'medium',
}) {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const timetable = {};

  days.forEach((day, i) => {
    timetable[day] = [];

    const subjectsForDay = subjects.slice(
      0,
      Math.max(1, Math.ceil(subjects.length / 2))
    );

    subjectsForDay.forEach((subject, j) => {
      const slotHours = Math.max(
        1,
        Math.ceil(studyHoursPerDay / subjectsForDay.length)
      );

      const startHour = 9 + j * slotHours;

      timetable[day].push({
        subject,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + slotHours).padStart(2, '0')}:00`,
        type: i % 3 === 0 ? 'revision' : 'new-topic',
      });
    });
  });

  return {
    learningPace,
    timetable,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = router;