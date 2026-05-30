import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AssessmentPage from './pages/AssessmentPage';
import DashboardPage from './pages/DashboardPage';
import TutorPage from './pages/TutorPage';
import QuizPage from './pages/QuizPage';
import TestPage from './pages/TestPage';
import GroupsPage from './pages/GroupsPage';
import ProgressPage from './pages/ProgressPage';
import StudyPlanPage from './pages/StudyPlanPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();

  return user ? children : <Navigate to="/login" />;
};

/*const PrivateRoute = ({ children }) => {
  return children;
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" />;*/


const AssessmentRoute = ({ children }) => {
  return children;
};
/*const AssessmentRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!user.isAssessmentDone) return <Navigate to="/assessment" />;
  return children;
};*/

function AppRoutes() {
  const {user}  =  useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/assessment" element={<PrivateRoute><AssessmentPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><AssessmentRoute><DashboardPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/tutor" element={<PrivateRoute><AssessmentRoute><TutorPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/quiz" element={<PrivateRoute><AssessmentRoute><QuizPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/test" element={<PrivateRoute><AssessmentRoute><TestPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/groups" element={<PrivateRoute><AssessmentRoute><GroupsPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/progress" element={<PrivateRoute><AssessmentRoute><ProgressPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="/study-plan" element={<PrivateRoute><AssessmentRoute><StudyPlanPage /></AssessmentRoute></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

export default function App() {

  return (
    
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a2235', color: '#f1f5f9', border: '1px solid #1e3a5f', fontFamily: 'DM Sans, sans-serif' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </Router>
    </AuthProvider>
   
    
  );
}