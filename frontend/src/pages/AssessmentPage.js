import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import './AuthPages.css';
import api from '../api';

const COURSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'B.Tech CSE', 'B.Tech ECE', 'BCA', 'MCA', 'B.Sc Physics', 'B.Sc Maths', 'B.Com', 'MBA', 'UPSC Prep', 'JEE Prep', 'NEET Prep', 'Other'];
const SUBJECTS_BY_COURSE = {
  'Class 10': ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
  'Class 11': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
  'Class 12': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
  'B.Tech CSE': ['Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Machine Learning'],
  'JEE Prep': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET Prep': ['Physics', 'Chemistry', 'Biology'],
  default: ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Economics', 'Physics', 'Chemistry'],
};

const STEPS = [
  { id: 'course', question: '🎓 What are you currently studying?', type: 'grid' },
  { id: 'level', question: '📊 What is your current learning level?', type: 'options',
    options: [{ value: 'beginner', label: '🌱 Beginner', desc: 'Just starting out' },
               { value: 'intermediate', label: '🌿 Intermediate', desc: 'Know the basics' },
               { value: 'advanced', label: '🌳 Advanced', desc: 'Deep knowledge' }] },
  { id: 'subjects', question: '📚 Which subjects do you want to study?', type: 'tags' },
  { id: 'hours', question: '⏰ How many hours can you study per day?', type: 'hours' },
  { id: 'pace', question: '🚀 What is your preferred learning pace?', type: 'options',
    options: [{ value: 'slow', label: '🐢 Slow & Steady', desc: 'Thorough understanding' },
               { value: 'moderate', label: '🐇 Moderate', desc: 'Balanced approach' },
               { value: 'fast', label: '⚡ Fast Track', desc: 'Quick coverage' }] },
  { id: 'language', question: '🌐 Preferred language for learning?', type: 'options',
    options: [{ value: 'English', label: '🇬🇧 English' }, { value: 'Hindi', label: '🇮🇳 Hindi' },
              { value: 'Hinglish', label: '🤝 Hinglish' }, { value: 'Other', label: '🌍 Other' }] },
];

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ course: '', level: '', subjects: [], hours: 2, pace: 'moderate', language: 'English' });
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const current = STEPS[step];
  const availableSubjects = SUBJECTS_BY_COURSE[answers.course] || SUBJECTS_BY_COURSE.default;

  const canProceed = () => {
    if (current.id === 'course') return answers.course !== '';
    if (current.id === 'level') return answers.level !== '';
    if (current.id === 'subjects') return answers.subjects.length > 0;
    if (current.id === 'hours') return answers.hours >= 1;
    if (current.id === 'pace') return answers.pace !== '';
    if (current.id === 'language') return answers.language !== '';
    return true;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/assessment/submit', {
        studyHoursPerDay: answers.hours,
        learningLevel: answers.level,
        course: answers.course,
        preferredLanguage: answers.language,
        subjects: answers.subjects,
        learningPace: answers.pace,
      });
      updateUser(res.data.user);
      toast.success('Profile set up! Generating your study plan... 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (sub) => {
    setAnswers(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub) ? prev.subjects.filter(s => s !== sub) : [...prev.subjects, sub],
    }));
  };

  return (
    <div className="assessment-page">
      <div className="auth-bg">
        <div className="auth-orb orb-1" /><div className="auth-orb orb-2" /><div className="auth-orb orb-3" />
      </div>
      <div className="assessment-card fade-in">
        <div className="assessment-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="auth-logo-icon" style={{ width: 36, height: 36 }}><Sparkles size={16} /></div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>StudyMind<span style={{ color: 'var(--accent-primary)' }}>AI</span></span>
          </div>
          <h2 className="gradient-text">Let's personalize your learning</h2>
          <p>Answer a few questions so we can build your perfect study plan</p>
        </div>

        <div className="assessment-progress">
          <div className="progress-label">Step {step + 1} of {STEPS.length}</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="assess-question fade-in" key={step}>
          <h3>{current.question}</h3>

          {current.type === 'grid' && (
            <div className="tag-grid">
              {COURSES.map(c => (
                <button key={c} className={`tag-btn ${answers.course === c ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, course: c, subjects: [] })}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {current.type === 'options' && (
            <div className="option-grid">
              {current.options.map(opt => (
                <button key={opt.value} className={`option-btn ${answers[current.id] === opt.value ? 'selected' : ''}`}
                  onClick={() => setAnswers({ ...answers, [current.id]: opt.value })}>
                  <div style={{ fontWeight: 600 }}>{opt.label}</div>
                  {opt.desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>}
                </button>
              ))}
            </div>
          )}

          {current.type === 'tags' && (
            <div className="tag-grid">
              {availableSubjects.map(sub => (
                <button key={sub} className={`tag-btn ${answers.subjects.includes(sub) ? 'selected' : ''}`} onClick={() => toggleSubject(sub)}>
                  {sub}
                </button>
              ))}
            </div>
          )}

          {current.type === 'hours' && (
            <div className="hours-input">
              <div className="hours-control">
                <button className="hours-btn" onClick={() => setAnswers({ ...answers, hours: Math.max(1, answers.hours - 1) })}>−</button>
                <div className="hours-value">{answers.hours}</div>
                <button className="hours-btn" onClick={() => setAnswers({ ...answers, hours: Math.min(12, answers.hours + 1) })}>+</button>
              </div>
              <span className="hours-label">hours per day</span>
            </div>
          )}
        </div>

        <div className="assess-nav">
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button className="btn-primary" onClick={handleNext} disabled={!canProceed() || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? 'Saving...' : step === STEPS.length - 1 ? 'Generate My Plan 🚀' : 'Next'}
            {!loading && step < STEPS.length - 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}