import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import './QuizPage.css';
import './TestPage.css';
import api from '../api';

export default function TestPage() {
  const { user } = useAuth();

  const subjects =
    user?.profile?.subjects?.length
      ? user.profile.subjects
      : ['Math', 'Science', 'Computer Science', 'English'];

  const [stage, setStage] = useState('setup');
  const [form, setForm] = useState({
    subject: user?.profile?.subjects?.[0] || '',
    numQuestions: 10,
  });

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const submitTest = useCallback(async () => {
    if (submitted || !test) return;

    const correct = test.questions.filter(
      q => answers[q.id] === q.correctAnswer
    ).length;

    setScore(correct);
    setSubmitted(true);
    setStage('result');

    try {
      await api.post('/api/progress/quiz-result', {
        subject: test.subject,
        score: correct,
        totalQuestions: test.questions.length,
        topic: 'Full Test',
        difficulty: user?.profile?.learningLevel || 'Beginner',
      });
    } catch (err) {
      console.error('Progress save error:', err);
    }
  }, [submitted, test, answers, user]);

  useEffect(() => {
    if (stage !== 'test' || submitted || !test) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft, submitted, test, submitTest]);

  const generateTest = async () => {
    if (!form.subject) {
      toast.error('Select a subject');
      return;
    }

    setStage('loading');

    try {
      const token = localStorage.getItem('token');

      const res = await api.post(
        '/api/ai/test',
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data?.test?.questions?.length) {
        throw new Error('Invalid test response from backend');
      }

      setTest(res.data.test);
      setAnswers({});
      setTimeLeft((res.data.test.duration || form.numQuestions * 3) * 60);
      setSubmitted(false);
      setScore(0);
      setStage('test');
    } catch (err) {
      console.error('Test generate error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to generate test');
      setStage('setup');
    }
  };

  const formatTime = seconds => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const pct = test ? Math.round((score / test.questions.length) * 100) : 0;
  const answered = Object.keys(answers).length;

  if (stage === 'loading') {
    return (
      <Layout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <h3>Generating your test...</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Creating comprehensive questions for {form.subject}
          </p>
        </div>
      </Layout>
    );
  }

  if (stage === 'result' && test) {
    return (
      <Layout>
        <div className="quiz-page fade-in">
          <div className="result-card card">
            <Trophy
              size={48}
              style={{
                color: pct >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)',
                marginBottom: 12,
              }}
            />

            <h2>Test Complete!</h2>

            <div className="result-score">
              {score}/{test.questions.length}
            </div>

            <div
              className="result-pct"
              style={{
                color: pct >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)',
              }}
            >
              {pct}%
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                margin: '12px 0',
              }}
            >
              <span className="badge badge-purple">{test.subject}</span>
              <span className="badge badge-amber">
                {test.totalMarks || test.questions.length * 2} marks total
              </span>
            </div>

            <p className="result-msg">
              {pct >= 90
                ? "🌟 Excellent! You're ready for the exam!"
                : pct >= 70
                ? '✅ Good performance! Review weak areas.'
                : "📚 More practice needed. Don't give up!"}
            </p>

            <div className="result-review">
              {test.questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}
                  >
                    <div className="review-header">
                      {isCorrect ? (
                        <CheckCircle
                          size={16}
                          style={{ color: 'var(--accent-green)' }}
                        />
                      ) : (
                        <XCircle
                          size={16}
                          style={{ color: 'var(--accent-rose)' }}
                        />
                      )}

                      <span>
                        Q{i + 1}: {q.question}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="review-answer">
                        <span style={{ color: 'var(--accent-rose)' }}>
                          Your: {answers[q.id] || 'Skipped'}
                        </span>
                        <span style={{ color: 'var(--accent-green)' }}>
                          Correct: {q.correctAnswer}
                        </span>
                      </div>
                    )}

                    {q.explanation && (
                      <p className="review-explanation">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setStage('setup');
                setTest(null);
                setAnswers({});
                setTimeLeft(0);
                setScore(0);
                setSubmitted(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '20px auto 0',
              }}
            >
              <RotateCcw size={16} /> Take New Test
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (stage === 'test' && test) {
    return (
      <Layout>
        <div className="quiz-page test-page fade-in">
          <div className="test-topbar">
            <div>
              <h2>{test.title}</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {answered}/{test.questions.length} answered
              </span>
            </div>

            <div
              className="test-timer"
              style={{
                color:
                  timeLeft < 120
                    ? 'var(--accent-rose)'
                    : 'var(--text-primary)',
              }}
            >
              <Clock size={18} /> {formatTime(timeLeft)}
            </div>
          </div>

          <div className="test-layout">
            <div className="test-questions">
              {test.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="question-card card"
                  id={`q-${q.id}`}
                >
                  <div className="question-num">
                    Question {i + 1} · {q.marks || 1} mark
                    {(q.marks || 1) > 1 ? 's' : ''}
                  </div>

                  <h3 className="question-text" style={{ fontSize: 16 }}>
                    {q.question}
                  </h3>

                  {q.type !== 'short' ? (
                    <div className="options-list">
                      {q.options?.map((opt, j) => (
                        <button
                          key={j}
                          type="button"
                          className={`option-item ${
                            answers[q.id] === opt ? 'selected' : ''
                          }`}
                          onClick={() =>
                            setAnswers(prev => ({
                              ...prev,
                              [q.id]: opt,
                            }))
                          }
                        >
                          <div className="option-letter">
                            {['A', 'B', 'C', 'D'][j]}
                          </div>
                          <span>{opt.replace(/^[ABCD]\)\s*/, '')}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      placeholder="Write your answer..."
                      value={answers[q.id] || ''}
                      onChange={e =>
                        setAnswers(prev => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      style={{ marginTop: 12, resize: 'vertical' }}
                    />
                  )}
                </div>
              ))}

              <button
                className="btn-primary"
                onClick={submitTest}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 16,
                }}
              >
                Submit Test ({answered}/{test.questions.length} answered)
              </button>
            </div>

            <div className="test-nav card">
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>
                Question Navigator
              </h4>

              <div className="nav-grid">
                {test.questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`nav-dot ${answers[q.id] ? 'answered' : ''}`}
                    onClick={() =>
                      document
                        .getElementById(`q-${q.id}`)
                        ?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        })
                    }
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="nav-legend">
                <span>
                  <span className="dot answered" />
                  Answered
                </span>
                <span>
                  <span className="dot" />
                  Unanswered
                </span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="quiz-page fade-in">
        <div className="quiz-setup-header">
          <div
            className="tutor-avatar"
            style={{
              width: 48,
              height: 48,
              background:
                'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
            }}
          >
            <ClipboardList size={22} />
          </div>

          <div>
            <h1>Full Test Mode</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Timed, comprehensive assessment with AI grading
            </p>
          </div>
        </div>

        <div className="quiz-setup card">
          <h3 style={{ marginBottom: 20 }}>Configure Your Test</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className="setup-field">
              <label>Subject</label>
              <select
                value={form.subject}
                onChange={e =>
                  setForm({
                    ...form,
                    subject: e.target.value,
                  })
                }
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="setup-field">
              <label>Number of Questions</label>
              <select
                value={form.numQuestions}
                onChange={e =>
                  setForm({
                    ...form,
                    numQuestions: Number(e.target.value),
                  })
                }
              >
                {[5, 10, 15, 20].map(n => (
                  <option key={n} value={n}>
                    {n} Questions (~{n * 3} min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <span className="badge badge-amber">
              <Clock size={12} /> Timed test
            </span>
            <span className="badge badge-purple">
              {user?.profile?.learningLevel || 'Beginner'} level
            </span>
            <span className="badge badge-green">Mixed question types</span>
          </div>

          <button
            className="btn-primary"
            onClick={generateTest}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ClipboardList size={16} /> Generate Test with AI
          </button>
        </div>
      </div>
    </Layout>
  );
}