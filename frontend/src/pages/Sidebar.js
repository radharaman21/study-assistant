import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Brain, BookOpen, ClipboardList, Users,
  TrendingUp, Calendar, LogOut, Menu, X, Sparkles
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tutor', icon: Brain, label: 'AI Tutor' },
  { to: '/quiz', icon: BookOpen, label: 'Quiz' },
  { to: '/test', icon: ClipboardList, label: 'Tests' },
  { to: '/study-plan', icon: Calendar, label: 'Study Plan' },
  { to: '/groups', icon: Users, label: 'Peer Groups' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon"><Sparkles size={18} /></div>
            <span>StudyMind<span className="logo-ai">AI</span></span>
          </div>
          <button className="close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-course">{user?.profile?.course || 'Set up profile'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="xp-bar">
            <div className="xp-label">
              <span>⚡ {user?.points || 0} XP</span>
              <span className="xp-streak">🔥 {user?.streakDays || 0} day streak</span>
            </div>
            <div className="xp-track"><div className="xp-fill" style={{ width: `${Math.min(((user?.points || 0) % 100), 100)}%` }} /></div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}