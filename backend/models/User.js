const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    isAssessmentDone: { type: Boolean, default: false },
    profile: {
      studyHoursPerDay: { type: Number, default: 2 },
      learningLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      course: { type: String, default: '' },
      preferredLanguage: { type: String, default: 'English' },
      subjects: [{ type: String }],
      learningPace: { type: String, enum: ['slow', 'moderate', 'fast'], default: 'moderate' },
    },
    studyPlan: { type: mongoose.Schema.Types.Mixed, default: null },
    studyGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    points: { type: Number, default: 0 },
    quizzesTaken: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);