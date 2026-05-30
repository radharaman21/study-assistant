<div align="center">

# 🎓 StudyMind AI

### Adaptive AI-Based Personalized Study Assistant with Peer Collaboration System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)

<br/>

> A full-stack web application that uses **Google Gemini AI** to generate personalized study plans, quizzes, and timed tests — with real-time peer collaboration via Socket.IO.

<br/>

![Status](https://img.shields.io/badge/Status-Ready%20to%20Run-brightgreen?style=flat-square)
![Files](https://img.shields.io/badge/Total%20Files-41-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## 📌 Table of Contents

- [✨ Features](#-features)
- [🏗️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Environment Setup](#-environment-setup)
- [🎮 How to Use](#-how-to-use)
- [🔑 API Reference](#-api-reference)
- [🔌 WebSocket Events](#-websocket-events)
- [📸 Pages Overview](#-pages-overview)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🚀 Deployment](#-deployment)

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 🔐 | **User Authentication** | JWT-based signup & login with bcrypt password hashing |
| 📋 | **Learning Assessment** | 6-step onboarding wizard to capture course, subjects, level, pace & language |
| 🤖 | **AI Tutor Chat** | Multi-turn conversation with Gemini AI, fully personalized to student profile |
| 📅 | **AI Study Plan** | Auto-generated 7-day timetable with topics, timings, resources & weekly goals |
| 📝 | **AI Quiz Generator** | Subject + topic specific MCQ quizzes at your difficulty level |
| 📋 | **Timed Full Tests** | Comprehensive tests with countdown timer, navigator panel & auto-submit |
| 👥 | **Peer Study Groups** | Create/join groups, real-time chat via Socket.IO, course-based recommendations |
| 📊 | **Progress Tracker** | Line charts, bar charts, pie charts, quiz history table & XP system |
| 🌐 | **Multilingual** | English, Hindi, Hinglish support via AI language preference |
| 🔥 | **Streak System** | Daily streak tracking + XP points gamification |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| React Router | v6 | Client-side routing |
| Axios | latest | HTTP requests to backend |
| Socket.IO Client | 4.x | Real-time peer chat |
| Recharts | 2.x | Progress charts & graphs |
| React Markdown | 9.x | Render AI tutor responses |
| Lucide React | latest | Icon library |
| React Hot Toast | 2.x | Notifications |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | v18+ | Runtime |
| Express.js | 4.x | REST API framework |
| Socket.IO | 4.x | Real-time WebSocket server |
| Mongoose | 8.x | MongoDB ODM |
| @google/generative-ai | 0.21+ | Gemini AI integration |
| JSON Web Token | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| dotenv | 16.x | Environment variables |
| nodemon | 3.x | Dev auto-restart |

### Database & AI
| Service | Purpose |
|---------|---------|
| **MongoDB** | Stores users, groups, messages, progress data |
| **Gemini 1.5 Flash** | AI tutor chat, quiz & explain endpoints |
| **Gemini 1.5 Pro** | Study plan generation & full test creation |

---

## 📁 Project Structure

```
study-assistant/
│
├── 📄 .gitignore
├── 📄 package.json                     ← Root scripts
├── 📖 README.md
│
├── 📁 backend/
│   ├── 📄 server.js                    ← Express app + Socket.IO + MongoDB
│   ├── 📄 package.json
│   ├── 📄 .env.example                 ← Copy to .env and fill your keys
│   ├── 📄 .env                         ← Your actual secrets (never commit)
│   ├── 📄 .gitignore
│   │
│   ├── 📁 middleware/
│   │   └── auth.js                     ← JWT protect() middleware
│   │
│   ├── 📁 models/
│   │   ├── User.js                     ← User schema (profile, studyPlan, XP)
│   │   ├── Group.js                    ← Study group schema + messages
│   │   └── Progress.js                 ← Quiz results & study sessions
│   │
│   └── 📁 routes/
│       ├── auth.js                     ← POST /register, /login, GET /me
│       ├── assessment.js               ← POST /submit (saves learning profile)
│       ├── ai.js                       ← /chat, /quiz, /test, /study-plan, /explain
│       ├── groups.js                   ← Group CRUD + join/leave + messages
│       ├── progress.js                 ← Save quiz results, log study sessions
│       └── chat.js                     ← Placeholder (real-time via Socket.IO)
│
└── 📁 frontend/
    ├── 📄 package.json
    ├── 📄 .gitignore
    │
    ├── 📁 public/
    │   └── index.html                  ← HTML shell with Google Fonts
    │
    └── 📁 src/
        ├── index.js                    ← React root entry point
        ├── App.js                      ← Routes + PrivateRoute guards
        ├── index.css                   ← Global CSS variables, dark theme
        │
        ├── 📁 context/
        │   └── AuthContext.js          ← Global auth state
        │
        ├── 📁 components/
        │   ├── Layout.js               ← Page wrapper with sidebar
        │   ├── Sidebar.js              ← Navigation + XP bar + streak
        │   └── Sidebar.css
        │
        └── 📁 pages/
            ├── LoginPage.js
            ├── RegisterPage.js
            ├── AuthPages.css
            ├── AssessmentPage.js       ← 6-step learning profile wizard
            ├── DashboardPage.js        ← Stats, schedule, quick actions
            ├── DashboardPage.css
            ├── TutorPage.js            ← AI chat tutor
            ├── TutorPage.css
            ├── QuizPage.js             ← AI quiz generator
            ├── QuizPage.css
            ├── TestPage.js             ← Timed full test
            ├── TestPage.css
            ├── StudyPlanPage.js        ← 7-day AI timetable
            ├── StudyPlanPage.css
            ├── GroupsPage.js           ← Peer groups + real-time chat
            ├── GroupsPage.css
            ├── ProgressPage.js         ← Charts, stats, quiz history
            └── ProgressPage.css
```

---

## ⚡ Quick Start

### ✅ Prerequisites

- **[Node.js v18+](https://nodejs.org)** — includes npm
- **[MongoDB](https://www.mongodb.com/try/download/community)** — local OR free cloud via [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Gemini API Key** — free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

### Step 1 — Install Dependencies

```bash
# Install backend dependencies
cd study-assistant/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure Environment Variables

```bash
cd study-assistant/backend
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/study-assistant
JWT_SECRET=studymind_super_secret_jwt_key_2024_change_this
GEMINI_API_KEY=AIzaSy_YOUR_ACTUAL_KEY_HERE
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

> 🔑 Get your free Gemini API key at **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**

---

### Step 3 — Start MongoDB

**Option A — Local MongoDB:**
```bash
mongod
```

**Option B — MongoDB Atlas (Cloud):**
- Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Copy your connection string and paste it as `MONGODB_URI` in `.env`

---

### Step 4 — Run the Application

You need **two terminals open simultaneously**:

**Terminal 1 — Start Backend:**
```bash
cd study-assistant/backend
npm run dev
```
> ✅ Backend running at `http://localhost:5000`

**Terminal 2 — Start Frontend:**
```bash
cd study-assistant/frontend
npm start
```
> ✅ Frontend opens at `http://localhost:3000`

---

## 🔧 Environment Setup

### `backend/.env` — All Variables Explained

```env
# Server port (default: 5000)
PORT=5000

# MongoDB connection string
# Local:  mongodb://localhost:27017/study-assistant
# Atlas:  mongodb+srv://username:password@cluster.mongodb.net/study-assistant
MONGODB_URI=mongodb://localhost:27017/study-assistant

# JWT secret key — use a long random string (min 32 characters)
JWT_SECRET=studymind_super_secret_jwt_key_2024_change_this

# Your Google Gemini API key — get free at aistudio.google.com
GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE

# Environment mode
NODE_ENV=development

# Frontend URL for CORS (must match where React is running)
CLIENT_URL=http://localhost:3000
```

---

## 🎮 How to Use

Once both servers are running, open **http://localhost:3000** in your browser:

```
1. 📝  Register          →  Create a new account
2. 📋  Assessment        →  Complete 6-step learning profile setup
                             (course, level, subjects, hours/day, pace, language)
3. 🏠  Dashboard         →  View stats, today's schedule, quick action cards
4. 🤖  AI Tutor          →  Chat with Gemini AI for instant explanations
5. 📅  Study Plan        →  Generate your 7-day AI-powered timetable
6. 📝  Quiz              →  Pick a subject + topic, take an AI-generated quiz
7. 📋  Full Test         →  Take a timed exam with automatic scoring
8. 👥  Peer Groups       →  Join study groups, chat with classmates in real-time
9. 📊  Progress          →  Track quiz scores, XP points, streaks & charts
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Create new account, returns JWT |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT + user object |
| `GET` | `/api/auth/me` | ✅ | Get currently logged-in user |

### Assessment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/assessment/submit` | ✅ | Save learning profile |

### AI — Gemini Powered
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ai/chat` | ✅ | Multi-turn AI tutor conversation |
| `POST` | `/api/ai/quiz` | ✅ | Generate MCQ quiz for a subject/topic |
| `POST` | `/api/ai/test` | ✅ | Generate full timed test |
| `POST` | `/api/ai/study-plan` | ✅ | Generate 7-day personalized timetable |
| `POST` | `/api/ai/explain` | ✅ | Explain a topic at student's level |

### Study Groups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/groups` | ✅ | List all study groups |
| `GET` | `/api/groups/recommended` | ✅ | Groups matching your course |
| `POST` | `/api/groups` | ✅ | Create a new study group |
| `POST` | `/api/groups/:id/join` | ✅ | Join a group |
| `POST` | `/api/groups/:id/leave` | ✅ | Leave a group |
| `GET` | `/api/groups/:id/messages` | ✅ | Fetch last 50 chat messages |
| `POST` | `/api/groups/:id/messages` | ✅ | Post a message to group |

### Progress
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/progress` | ✅ | Get all progress data |
| `POST` | `/api/progress/quiz-result` | ✅ | Save quiz score + award XP |
| `POST` | `/api/progress/study-session` | ✅ | Log a study session |

> ✅ = Requires `Authorization: Bearer <token>` header

---

## 🔌 WebSocket Events

Real-time chat is handled via **Socket.IO** on the same backend port.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-room` | Client → Server | `{ roomId, userId, userName }` | Join a group chat room |
| `send-message` | Client → Server | `{ roomId, message, userId, userName }` | Send a message |
| `receive-message` | Server → Client | `{ id, message, userId, userName, timestamp }` | New message broadcast |
| `user-joined` | Server → Client | `{ userName }` | Someone joined the room |
| `user-left` | Server → Client | `{ userName }` | Someone left the room |
| `typing` | Client → Server | `{ roomId, userName }` | User started typing |
| `user-typing` | Server → Client | `{ userName }` | Show typing indicator |
| `stop-typing` | Client → Server | `{ roomId }` | User stopped typing |
| `room-users` | Server → Client | `[users]` | Current users in room |

---

## 📸 Pages Overview

| Page | Route | What It Does |
|------|-------|-------------|
| **Login** | `/login` | Sign in with email & password |
| **Register** | `/register` | Create a new account |
| **Assessment** | `/assessment` | 6-step profile wizard (first login only) |
| **Dashboard** | `/dashboard` | Stats overview + today's schedule + quick actions |
| **AI Tutor** | `/tutor` | Chat with Gemini AI — ask anything about your subjects |
| **Quiz** | `/quiz` | AI-generated practice quizzes by subject & topic |
| **Test** | `/test` | Full timed test with question navigator |
| **Study Plan** | `/study-plan` | 7-day timetable with day tabs & session timeline |
| **Peer Groups** | `/groups` | Create/join groups + real-time chat |
| **Progress** | `/progress` | Score trends, subject charts, quiz history |

---

## 🛠️ Troubleshooting

### ❌ `GEMINI_API_KEY` invalid or missing
- Make sure `.env` exists inside the `backend/` folder
- Your key should start with `AIzaSy...`
- Get a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### ❌ MongoDB connection failed
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```
- Run `mongod` in a separate terminal to start MongoDB locally
- Or switch to MongoDB Atlas and update `MONGODB_URI` in `.env`

### ❌ CORS error / Socket.IO not connecting
- Ensure `CLIENT_URL=http://localhost:3000` is set in `backend/.env`
- Make sure the backend is running before the frontend

### ❌ Module not found error
```bash
cd frontend && npm install
cd ../backend && npm install
```

### ❌ Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac / Linux
lsof -ti:3000 | xargs kill
```

### ❌ Blank white screen on frontend
- Open browser DevTools (`F12`) → **Console** tab to see the exact error
- Make sure backend is running at `http://localhost:5000`

---

## 📦 Dependencies Summary

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "socket.io": "^4.6.1",
    "@google/generative-ai": "^0.21.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "socket.io-client": "^4.6.1",
    "react-markdown": "^9.0.1",
    "recharts": "^2.10.1",
    "lucide-react": "^0.292.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^3.0.0"
  }
}
```

---

## 🚀 Deployment

### Deploy to [Render](https://render.com) (Free)

**Backend:**
1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all `.env` variables in the **Environment** tab

**Frontend:**
1. Create a new **Static Site** on Render
2. Connect repo, set root to `frontend/`
3. Build command: `npm run build`
4. Publish directory: `build`

### Deploy to [Railway](https://railway.app)

```bash
npm install -g @railway/cli
cd backend
railway login
railway init
railway up
```

### Production Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/study-assistant
JWT_SECRET=a_very_long_random_secret_min_64_chars
GEMINI_API_KEY=AIzaSy_YOUR_KEY
CLIENT_URL=https://your-frontend-domain.com
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ using React, Node.js, MongoDB & Google Gemini AI**

⭐ Star this repo if you found it helpful!

</div>