import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Calendar, RefreshCw, Clock, BookOpen, Target, Lightbulb, Zap } from 'lucide-react';
import './StudyPlanPage.css';

function extractStudyPlan(data) {
  if (!data) return null;

  // Case 1: direct StudyPlan
  if (data.StudyPlan) return data.StudyPlan;

  // Case 2: study_plan array
  if (data.study_plan) return data.study_plan;

  // Case 3: dynamic key (like "Charu's 7-Day Study Plan")
  const firstKey = Object.keys(data)[0];
  if (typeof data[firstKey] === "object") {
    return data[firstKey];
  }

  return null;
}

function getHoursFromTime(start, end) {
  try {
    const parse = (time) => {
      let [t, modifier] = time.split(" ");
      let [hours, minutes] = t.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return hours + minutes / 60;
    };

    return parse(end) - parse(start);

  } catch {
    return 0;
  }
}
function convertToTimetable(studyPlanObj) {
  const timetable = {};

  if (!studyPlanObj || typeof studyPlanObj !== "object") {
    console.log("❌ Invalid StudyPlan:", studyPlanObj);
    return {};
  }

  const entries = Object.entries(studyPlanObj);

  entries.forEach(([dayKey, data], index) => {
    // ✅ SAFE TIME SPLIT
    const timeString = data.Time || "10:00 AM - 11:00 AM";
    const [startRaw, endRaw] = timeString.split("-");

    const startTime = startRaw?.trim() || "10:00 AM";
    const endTime = endRaw?.trim() || "11:00 AM";

    timetable[DAYS[index]] = [
      {
        subject: data.Subject || "Study",
        topic: data.Topic || "",
        startTime: startTime,
        endTime: endTime,
        type: "new-topic",
        resources: [],
      },
    ];
  });

  return timetable;
}



const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TYPE_COLORS = {
  'new-topic': { bg: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', label: 'New Topic' },
  'revision': { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', label: 'Revision' },
  'practice': { bg: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', label: 'Practice' },
  default: { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', label: 'Study' },
};

export default function StudyPlanPage() {
  const [plan, setPlan] = useState(null);
  const { user, updateUser } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return DAYS[d === 0 ? 6 : d - 1];
  });

  const timetable = plan?.timetable || {};
  // ✅ SUBJECT COUNT FIX
  const subjectsSet = new Set();

  Object.values(timetable || {}).forEach(day => {
    (day || []).forEach(session => {
      if (session?.subject) {
        subjectsSet.add(session.subject);
      }
    });
  });

const totalSubjects = subjectsSet.size;

  const generatePlan = async () => {
  setGenerating(true);
  try {
    const res = await axios.post("/api/ai/study-plan", {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    //console.log("PLAN:", res.data.StudyPlan);
    console.log("RAW RESPONSE:", res.data);
    console.log("STUDY PLAN:", res.data?.StudyPlan);
    // 👉 yaha plan set karo (depending on your state)
    const studyObj = extractStudyPlan(res.data);

    console.log("✅ EXTRACTED PLAN:", studyObj);

    if (!studyObj) {
    throw new Error("Invalid study plan format");
    }

    console.log("PLAN:", studyObj);

    setPlan({
      timetable: convertToTimetable(studyObj)
    });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err);
    alert(err.response?.data?.message || "Failed to generate plan");
  } finally {
    setGenerating(false);
  }
};

  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex === 0 ? 6 : todayIndex - 1];

  const totalSessionsPerWeek = Object.values(timetable).reduce((a, day) => a + (day?.length || 0), 0);
  const totalHoursPerWeek = Object.values(timetable || {}).reduce((a, day) => {
    return a + (day || []).reduce((s, slot) => {
      if (!slot?.startTime || !slot?.endTime) return s;

      try {
        const parse = (time) => {
          let [t, modifier] = time.split(" ");
          let [h, m] = t.split(":").map(Number);

          if (modifier === "PM" && h !== 12) h += 12;
          if (modifier === "AM" && h === 12) h = 0;

          return h + m / 60;
        };

        return s + (parse(slot.endTime) - parse(slot.startTime));
      } catch {
        return s;
      }

    }, 0);
  }, 0);

  return (
    <Layout>
      <div className="study-plan-page fade-in">
        {/* Header */}
        <div className="plan-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="tutor-avatar" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-cyan))' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h1>Study Timetable</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {plan ? `Last generated: ${new Date(plan?.generatedAt).toLocaleDateString()}` : 'No plan generated yet'}
              </p>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={generatePlan}
            disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {generating ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
            ) : (
              <><RefreshCw size={16} /> {plan ? 'Regenerate Plan' : 'Generate Plan'}</>
            )}
          </button>
        </div>

        {!plan && !generating ? (
          <div className="no-plan card">
            <Calendar size={56} style={{ color: 'var(--text-muted)', marginBottom: 20 }} />
            <h2>No Study Plan Yet</h2>
            <p>Click "Generate Plan" to create your AI-personalized weekly timetable based on your subjects, level, and available time.</p>
            <button className="btn-primary" onClick={generatePlan} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, margin: '20px auto 0' }}>
              <Zap size={16} /> Generate My Study Plan
            </button>
          </div>
        ) : generating ? (
          <div className="no-plan card">
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <h2>Creating your personalized plan...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>AI is analyzing your profile and building an optimized schedule</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="plan-stats">
              {[
                { icon: Clock, label: 'Hours/Week', value: totalHoursPerWeek.toFixed(1), color: 'var(--accent-primary)' },
                { icon: BookOpen, label: 'Sessions/Week', value: totalSessionsPerWeek, color: 'var(--accent-green)' },
                { icon: Target, label: 'Subjects', value:totalSubjects, color: 'var(--accent-amber)' },
                { icon: Zap, label: 'Study Pace', value: user?.profile?.learningPace || 'moderate', color: 'var(--accent-cyan)', isText: true },
              ].map(({ icon: Icon, label, value, color, isText }) => (
                <div className="plan-stat card" key={label}>
                  <div className="stat-icon" style={{ background: `${color}20`, color, width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: isText ? 14 : 22, fontWeight: 800, textTransform: isText ? 'capitalize' : 'none' }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Day tabs */}
            <div className="day-tabs">
              {DAYS.map((day, i) => {
                const hasSession = (timetable[day]?.length || 0) > 0;
                const isToday = day === todayName;
                return (
                  <button
                    key={day}
                    className={`day-tab ${activeDay === day ? 'active' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setActiveDay(day)}
                  >
                    <span className="day-short">{DAY_SHORT[i]}</span>
                    <span className="day-full">{day}</span>
                    {isToday && <span className="today-dot" />}
                    {hasSession && <span className="session-count">{timetable[day].length}</span>}
                  </button>
                );
              })}
            </div>

            {/* Day schedule */}
            <div className="day-schedule fade-in" key={activeDay}>
              <div className="day-schedule-header">
                <h2>{activeDay} {activeDay === todayName ? <span className="today-badge">Today</span> : ''}</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {(timetable[activeDay]?.length || 0)} sessions scheduled
                </span>
              </div>

              {(!timetable[activeDay] || timetable[activeDay].length === 0) ? (
                <div className="rest-day card">
                  <span style={{ fontSize: 36 }}>🌙</span>
                  <h3>Rest Day</h3>
                  <p>Take a break and recharge! Consistent rest is key to effective learning.</p>
                </div>
              ) : (
                <div className="timeline">
                  {timetable[activeDay].map((slot, i) => {
                    const typeStyle = TYPE_COLORS[slot.type] || TYPE_COLORS.default;
                    return (
                      <div className="timeline-item" key={i}>
                        <div className="timeline-time">
                          <span className="time-start">{slot.startTime}</span>
                          <div className="time-line" />
                          <span className="time-end">{slot.endTime}</span>
                        </div>
                        <div className="timeline-card card">
                          <div className="tc-header">
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <h3 className="tc-subject">{slot.subject}</h3>
                                <span className="tc-type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                                  {typeStyle.label}
                                </span>
                              </div>
                              {slot.topic && <p className="tc-topic">{slot.topic}</p>}
                            </div>
                            <div className="tc-duration">
                              {(() => {
                                if (!slot.startTime || !slot.endTime) return '—';
                                const [sh, sm] = slot.startTime.split(':').map(Number);
                                const [eh, em] = slot.endTime.split(':').map(Number);
                                const mins = eh * 60 + em - sh * 60 - sm;
                                return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? mins % 60 + 'm' : ''}` : `${mins}m`;
                              })()}
                            </div>
                          </div>
                          {slot.resources && slot.resources.length > 0 && (
                            <div className="tc-resources">
                              {slot.resources.map((r, j) => (
                                <span key={j} className="resource-tag">{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly goals & tips */}
            <div className="plan-extras">
              {plan.weeklyGoals?.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Target size={18} style={{ color: 'var(--accent-green)' }} />
                    <h3 style={{ fontSize: 15 }}>Weekly Goals</h3>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan?.weeklyGoals?.map((goal, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.tips?.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Lightbulb size={18} style={{ color: 'var(--accent-amber)' }} />
                    <h3 style={{ fontSize: 15 }}>Study Tips</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan?.tips?.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, borderLeft: '3px solid var(--accent-amber)' }}>
                        💡 {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}