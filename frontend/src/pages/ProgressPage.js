import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Target, Zap, BookOpen } from 'lucide-react';
import './ProgressPage.css';
import api from '../api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e'];

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/progress')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </Layout>
  );

  const allQuizzes = data?.progress?.flatMap(p => p.quizResults?.map(q => ({ ...q, subject: p.subject })) || []) || [];
  const subjectData = data?.progress?.map(p => ({
    subject: p.subject.length > 10 ? p.subject.slice(0, 10) + '…' : p.subject,
    quizzes: p.quizResults?.length || 0,
    avgScore: p.quizResults?.length ? Math.round(p.quizResults.reduce((a, q) => a + (q.score / q.totalQuestions) * 100, 0) / p.quizResults.length) : 0,
  })) || [];

  const recentActivity = allQuizzes.slice(-10).map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: Math.round((q.score / q.totalQuestions) * 100),
    subject: q.subject,
  }));

  const pieData = subjectData.filter(s => s.quizzes > 0).map(s => ({ name: s.subject, value: s.quizzes }));

  const stats = [
    { icon: Zap, label: 'Total XP', value: data?.user?.points || 0, suffix: 'pts', color: 'var(--accent-primary)' },
    { icon: BookOpen, label: 'Quizzes', value: allQuizzes.length, suffix: '', color: 'var(--accent-green)' },
    { icon: Target, label: 'Avg Score', value: allQuizzes.length ? Math.round(allQuizzes.reduce((a, q) => a + (q.score / q.totalQuestions) * 100, 0) / allQuizzes.length) : 0, suffix: '%', color: 'var(--accent-amber)' },
    { icon: Award, label: 'Streak', value: data?.user?.streakDays || 0, suffix: 'days', color: 'var(--accent-rose)' },
  ];

  return (
    <Layout>
      <div className="progress-page fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div className="tutor-avatar" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 24 }}>Progress Tracker</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track your learning journey</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          {stats.map(({ icon: Icon, label, value, suffix, color }) => (
            <div className="stat-card card" key={label}>
              <div className="stat-icon" style={{ background: `${color}20`, color }}><Icon size={20} /></div>
              <div className="stat-value">{value}<span className="stat-suffix">{suffix}</span></div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {allQuizzes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <TrendingUp size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ marginBottom: 8 }}>No data yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Take some quizzes and tests to see your progress here</p>
          </div>
        ) : (
          <div className="charts-grid">
            {/* Score trend */}
            {recentActivity.length > 1 && (
              <div className="card chart-card">
                <h3 className="chart-title">Score Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                    <Line type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ fill: 'var(--accent-primary)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-subject bar */}
            {subjectData.length > 0 && (
              <div className="card chart-card">
                <h3 className="chart-title">Score by Subject</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={v => [`${v}%`, 'Avg Score']} />
                    <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                      {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie chart */}
            {pieData.length > 1 && (
              <div className="card chart-card">
                <h3 className="chart-title">Quiz Distribution</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <PieChart width={160} height={160}>
                    <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pieData.map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        <span style={{ fontWeight: 700, marginLeft: 'auto', paddingLeft: 8 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent quiz table */}
            <div className="card chart-card full-width">
              <h3 className="chart-title">Recent Quiz History</h3>
              <div className="quiz-table">
                <div className="table-header">
                  <span>Subject</span><span>Topic</span><span>Score</span><span>Date</span>
                </div>
                {allQuizzes.slice(-8).reverse().map((q, i) => (
                  <div className="table-row" key={i}>
                    <span className="badge badge-purple" style={{ fontSize: 11 }}>{q.subject}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{q.topic || 'General'}</span>
                    <span style={{ fontWeight: 700, color: (q.score / q.totalQuestions) >= 0.7 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                      {q.score}/{q.totalQuestions} ({Math.round((q.score / q.totalQuestions) * 100)}%)
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(q.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}