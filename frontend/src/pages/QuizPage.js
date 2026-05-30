import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, XCircle, RotateCcw, Trophy, Loader } from 'lucide-react';
import './QuizPage.css';
import api from '../api';

export default function QuizPage() {
  const { user } = useAuth();

  const [stage, setStage] = useState('setup');
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    numQuestions: 5,
  });

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const subjects =
    user?.subjects?.length
      ? user.subjects
      : user?.profile?.subjects?.length
      ? user.profile.subjects
      : ['Math', 'Science', 'Computer Science', 'English'];

  const generateQuiz = async () => {
    if (!form.subject || !form.topic) {
      toast.error('Please select subject and enter topic');
      return;
    }

    setStage('loading');

    try {
      const res = await api.post('/api/ai/quiz', form);

      setQuiz(res.data.quiz);
      setAnswers({});
      setCurrent(0);
      setShowResult(false);
      setScore(0);
      setStage('quiz');
    } catch (err) {
  console.log('STATUS:', err.response?.status);
  console.log('BACKEND MESSAGE:', err.response?.data);
  console.error('FULL ERROR:', err);

  toast.error(err.response?.data?.message || 'Failed to generate quiz');
  setStage('setup');
}
  };

  const selectAnswer = (questionId, answer) => {
    if (showResult) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    if (current < quiz.questions.length - 1) {
      setCurrent(current + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    const correct = quiz.questions.filter(
      q => answers[q.id] === q.correctAnswer
    ).length;

    setScore(correct);
    setShowResult(true);
    setStage('result');

    try {
     await api.post('/api/progress/quiz-result', {
  subject: quiz.subject,
  score: correct,
  totalQuestions: quiz.questions.length,
  topic: quiz.topic,
  difficulty: quiz.difficulty,
});
    } catch (err) {
      console.error(err);
    }
  };

  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  if (stage === 'loading') {
    return (
      <Layout>
        <div
          className="quiz-page fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <h3>Generating your quiz with AI...</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Tailoring questions for {user?.profile?.learningLevel || 'your'} level
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (stage === 'result' && quiz) {
    return (
      <Layout>
        <div className="quiz-page fade-in">
          <div className="result-card card">
            <div
              className="result-icon"
              style={{
                color: pct >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)',
              }}
            >
              <Trophy size={48} />
            </div>

            <h2>Quiz Complete!</h2>

            <div className="result-score">
              {score}/{quiz.questions.length}
            </div>

            <div
              className="result-pct"
              style={{
                color: pct >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)',
              }}
            >
              {pct}%
            </div>

            <p className="result-msg">
              {pct >= 90
                ? '🌟 Outstanding! You mastered this topic!'
                : pct >= 70
                ? '✅ Great work! Keep it up!'
                : "📚 Keep practicing, you're improving!"}
            </p>

            <div className="result-review">
              {quiz.questions.map((q, i) => {
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
                          Your answer: {answers[q.id] || 'Not answered'}
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
                setQuiz(null);
                setAnswers({});
                setCurrent(0);
                setScore(0);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '20px auto 0',
              }}
            >
              <RotateCcw size={16} /> Take Another Quiz
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (stage === 'quiz' && quiz) {
    const q = quiz.questions[current];

    return (
      <Layout>
        <div className="quiz-page fade-in">
          <div className="quiz-header">
            <div>
              <h1>{quiz.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {quiz.subject} · {quiz.difficulty} · {quiz.questions.length} questions
              </p>
            </div>

            <div className="quiz-progress-badge">
              {current + 1} / {quiz.questions.length}
            </div>
          </div>

          <div className="quiz-progress-bar">
            <div style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </div>

          <div className="question-card card fade-in" key={q.id}>
            <div className="question-num">Question {current + 1}</div>

            <h2 className="question-text">{q.question}</h2>

            <div className="options-list">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === opt;

                return (
                  <button
                    key={i}
                    type="button"
                    className={`option-item ${selected ? 'selected' : ''}`}
                    onClick={() => selectAnswer(q.id, opt)}
                  >
                    <div className="option-letter">
                      {['A', 'B', 'C', 'D'][i]}
                    </div>
                    <span>{opt.replace(/^[ABCD]\)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 24,
              }}
            >
              <button
                type="button"
                className="btn-primary"
                onClick={nextQuestion}
                disabled={!answers[q.id]}
              >
                {current === quiz.questions.length - 1
                  ? 'Submit Quiz'
                  : 'Next Question →'}
              </button>
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
          <div className="tutor-avatar" style={{ width: 48, height: 48 }}>
            <BookOpen size={22} />
          </div>

          <div>
            <h1>Practice Quiz</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              AI-generated questions tailored to your level
            </p>
          </div>
        </div>

        <div className="quiz-setup card">
          <h3 style={{ marginBottom: 20 }}>Configure Your Quiz</h3>

          <div className="setup-grid">
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
              <label>Topic</label>
              <input
                value={form.topic}
                onChange={e =>
                  setForm({
                    ...form,
                    topic: e.target.value,
                  })
                }
                placeholder="e.g. Newton's Laws, Recursion..."
              />
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
                {[3, 5, 7, 10].map(n => (
                  <option key={n} value={n}>
                    {n} Questions
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span className="badge badge-purple">
              {user?.profile?.learningLevel || 'Beginner'} level
            </span>
            <span className="badge badge-green">
              {user?.profile?.course || 'General'}
            </span>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={generateQuiz}
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Loader size={16} /> Generate Quiz with AI
          </button>
        </div>
      </div>
    </Layout>
  );
}