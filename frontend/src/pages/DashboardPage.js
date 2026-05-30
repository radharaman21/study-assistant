import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Brain, BookOpen, ClipboardList, Users, TrendingUp, Calendar, Zap, Target, Award, Clock } from 'lucide-react';
import './DashboardPage.css';

const QUICK_ACTIONS = [
  { to: '/tutor', icon: Brain, label: 'Ask AI Tutor', desc: 'Get instant answers', color: 'var(--accent-primary)' },
  { to: '/quiz', icon: BookOpen, label: 'Take a Quiz', desc: 'Test your knowledge', color: 'var(--accent-green)' },
  { to: '/test', icon: ClipboardList, label: 'Full Test', desc: 'Comprehensive assessment', color: 'var(--accent-amber)' },
  { to: '/groups', icon: Users, label: 'Peer Groups', desc: 'Study with friends', color: 'var(--accent-cyan)' },
  { to: '/study-plan', icon: Calendar, label: 'Study Plan', desc: 'Your timetable', color: 'var(--accent-secondary)' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', desc: 'Track your growth', color: 'var(--accent-rose)' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [todayPlan, setTodayPlan] = useState([]);

  useEffect(() => {
    axios.get('/api/progress').then(res => setProgress(res.data)).catch(() => {});
    loadTodayPlan();
  }, []);

  const loadTodayPlan = () => {
    if (user?.studyPlan?.timetable) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      setTodayPlan(user.studyPlan.timetable[today] || []);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalQuizzes = progress?.progress?.reduce((a, p) => a + (p.quizResults?.length || 0), 0) || 0;
  const avgScore = (() => {
    const all = progress?.progress?.flatMap(p => p.quizResults || []) || [];
    if (!all.length) return 0;
    return Math.round(all.reduce((a, q) => a + (q.score / q.totalQuestions) * 100, 0) / all.length);
  })();

  return (
    <Layout>
      <div className="dashboard fade-in">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dash-subtitle">
              {user?.profile?.course} · {user?.profile?.learningLevel} level · {user?.profile?.subjects?.slice(0, 3).join(', ')}
            </p>
          </div>
          <div className="dash-streak">
            <div className="streak-icon">🔥</div>
            <div>
              <div className="streak-num">{progress?.user?.streakDays || 0}</div>
              <div className="streak-label">day streak</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-grid">
          {[
            { icon: Zap, label: 'Total XP', value: progress?.user?.points || 0, color: 'var(--accent-primary)', suffix: 'pts' },
            { icon: BookOpen, label: 'Quizzes Taken', value: totalQuizzes, color: 'var(--accent-green)', suffix: '' },
            { icon: Target, label: 'Avg Score', value: avgScore, color: 'var(--accent-amber)', suffix: '%' },
            { icon: Clock, label: 'Study Hours/Day', value: user?.profile?.studyHoursPerDay || 0, color: 'var(--accent-cyan)', suffix: 'hrs' },
          ].map(({ icon: Icon, label, value, color, suffix }) => (
            <div className="stat-card card" key={label}>
              <div className="stat-icon" style={{ background: `${color}20`, color }}>
                <Icon size={20} />
              </div>
              <div className="stat-value">{value}<span className="stat-suffix">{suffix}</span></div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="dash-grid-2">
          {/* Quick Actions */}
          <div>
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
              {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc, color }) => (
                <Link to={to} key={to} className="action-card card">
                  <div className="action-icon" style={{ background: `${color}20`, color }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="action-label">{label}</div>
                    <div className="action-desc">{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div>
            <h2 className="section-title">Today's Schedule</h2>
            <div className="schedule-card card">
              {todayPlan.length === 0 ? (
                <div className="empty-schedule">
                  <Calendar size={32} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                  <p>No sessions scheduled for today</p>
                  <Link to="/study-plan" className="btn-primary" style={{ marginTop: 12, display: 'inline-block', fontSize: 13 }}>
                    Generate Study Plan
                  </Link>
                </div>
              ) : (
                <div className="schedule-list">
                  {todayPlan.map((item, i) => (
                    <div className="schedule-item" key={i}>
                      <div className="schedule-time">{item.startTime} – {item.endTime}</div>
                      <div className="schedule-info">
                        <div className="schedule-subject">{item.subject}</div>
                        {item.topic && <div className="schedule-topic">{item.topic}</div>}
                      </div>
                      <span className={`badge ${item.type === 'revision' ? 'badge-amber' : item.type === 'practice' ? 'badge-green' : 'badge-purple'}`}>
                        {item.type || 'study'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            {user?.studyPlan?.tips?.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: 24 }}>💡 Study Tips</h2>
                <div className="card tips-card">
                  {user.studyPlan.tips.slice(0, 3).map((tip, i) => (
                    <div className="tip-item" key={i}>
                      <Award size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}