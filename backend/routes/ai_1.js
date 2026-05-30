const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helper: get model ────────────────────────────────────────────────
function getModel() {
  console.log("Using model: gemini-2.5-flash");

  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash'
  });
}

// ─── Helper: retry wrapper for 429 rate limit errors ─────────────────
async function callWithRetry(fn, retries = 3, delayMs = 10000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('Too Many Requests') ||
        err?.message?.includes('quota');

      if (is429 && attempt < retries) {
        console.log(`⏳ Rate limit hit. Retrying in ${delayMs / 1000}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 1.5; // increase wait time each retry
      } else {
        throw err;
      }
    }
  }
}

// ─── Helper: build system prompt ─────────────────────────────────────
function buildSystemPrompt(user) {
  const p = user.profile || {};
  return `You are an expert AI study tutor for a student with the following profile:
- Name: ${user.name}
- Course/Class: ${p.course}
- Learning Level: ${p.learningLevel}
- Subjects: ${p.subjects?.join(', ') || 'General'}
- Study Hours/Day: ${p.studyHoursPerDay}
- Learning Pace: ${p.learningPace}
- Preferred Language: ${p.preferredLanguage}

Tailor ALL responses to this student's level. Use ${p.preferredLanguage} as the primary language.
Keep explanations appropriate for a ${p.learningLevel} student in ${p.course}.
Be encouraging, clear, and pedagogically sound.`;
}

// ─── Helper: convert chat history to Gemini format ───────────────────
function toGeminiHistory(history) {
  return history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// ─── Helper: friendly error response ─────────────────────────────────
function handleAIError(err, res, context = 'AI request') {
  console.error(`${context} ERROR:`, err.message || err);

  const is429 = err?.status === 429 ||
    err?.message?.includes('429') ||
    err?.message?.includes('quota') ||
    err?.message?.includes('Too Many Requests');

  if (is429) {
    return res.status(429).json({
      message: '⏳ Gemini API rate limit reached. Please wait 1-2 minutes and try again.',
      retryAfter: 60,
      tip: 'The free tier allows 15 requests/minute. Try again shortly.',
    });
  }

  res.status(500).json({ message: err.message || `${context} failed` });
}

// ════════════════════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════════════════════

// Chat with AI tutor
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await User.findById(req.user._id);
    const model = getModel();

    const systemTurn = [
      { role: 'user', parts: [{ text: buildSystemPrompt(user) }] },
      { role: 'model', parts: [{ text: 'Understood! I am ready to help you as your personalized AI tutor.' }] },
    ];

    const geminiHistory = [
      ...systemTurn,
      ...toGeminiHistory(history.slice(-10)),
    ];

    const reply = await callWithRetry(async () => {
      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(message);
      return result.response.text();
    });

    res.json({ reply });
  } catch (err) {
    handleAIError(err, res, 'Chat');
  }
});

// Generate quiz
router.post('/quiz', protect, async (req, res) => {
  try {
    const { subject, topic, numQuestions = 5 } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ message: 'Subject and topic are required' });
    }

    const user = await User.findById(req.user._id);

    const learningLevel = user?.profile?.learningLevel || 'Beginner';
    const course = user?.profile?.course || 'General';

    const model = getModel();

    const quizPrompt = `
Generate exactly ${numQuestions} multiple-choice questions about "${topic}" in "${subject}".

Student level: ${learningLevel}
Course: ${course}

Return ONLY valid JSON. No markdown. No code block.

{
  "quiz": {
    "title": "Quiz title",
    "subject": "${subject}",
    "topic": "${topic}",
    "difficulty": "${learningLevel}",
    "questions": [
      {
        "id": 1,
        "question": "Question text?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correctAnswer": "A) Option 1",
        "explanation": "Short explanation"
      }
    ]
  }
}
`;

    const result = await model.generateContent(quizPrompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.log('AI RAW RESPONSE:', text);
      return res.status(500).json({ message: 'AI did not return valid JSON' });
    }

    const quizData = JSON.parse(jsonMatch[0]);

    return res.status(200).json(quizData);
  } catch (err) {
    console.error('Quiz ERROR:', err);
    return res.status(500).json({
      message: err.message || 'Quiz generation failed',
    });
  }
});
// Generate personalized study plan
router.post('/study-plan', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const p = user.profile;
    const model = getModel();

    const prompt = `Create a detailed 7-day personalized study timetable for:
- Student: ${user.name}
- Course: ${p.course}
- Level: ${p.learningLevel}
- Subjects: ${p.subjects?.join(', ')}
- Study Hours/Day: ${p.studyHoursPerDay} hours
- Pace: ${p.learningPace}

Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "timetable": {
    "Monday": [{"subject": "...", "topic": "...", "startTime": "09:00", "endTime": "10:00", "type": "new-topic|revision|practice", "resources": ["..."]}],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": []
  },
  "weeklyGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const text = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }, 3, 15000); // longer delay for heavy requests

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const plan = JSON.parse(jsonMatch[0]);

    await User.findByIdAndUpdate(req.user._id, {
      studyPlan: { ...plan, generatedAt: new Date().toISOString() },
    });

    res.json(plan);
  } catch (err) {
    handleAIError(err, res, 'STUDY PLAN');
  }
});

// Explain a topic
router.post('/explain', protect, async (req, res) => {
  try {
    const { topic, subject } = req.body;
    const user = await User.findById(req.user._id);
    const model = getModel();

    const prompt = `Explain "${topic}" from ${subject} to a ${user.profile.learningLevel} student in ${user.profile.course}.
Use simple language, examples, and analogies. Include:
1. Core concept explanation
2. Real-world example
3. Key points to remember
4. Common mistakes to avoid

Keep it engaging and educational. Use ${user.profile.preferredLanguage}.`;

    const explanation = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });

    res.json({ explanation });
  } catch (err) {
    handleAIError(err, res, 'Explain');
  }
});

// Generate a full test
router.post('/test', protect, async (req, res) => {
  try {
    const { subject, numQuestions = 10 } = req.body;
    const user = await User.findById(req.user._id);
    const model = getModel();

    const prompt = `Generate a comprehensive ${numQuestions}-question test for ${subject} at ${user.profile.learningLevel} level (${user.profile.course}).
Include mixed question types: multiple choice (70%), true/false (20%), short answer concept (10%).

Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "test": {
    "title": "Test title",
    "subject": "${subject}",
    "duration": 30,
    "totalMarks": ${numQuestions * 2},
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "...",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correctAnswer": "A) ...",
        "marks": 2,
        "explanation": "..."
      }
    ]
  }
}`;

    const text = await callWithRetry(async () => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }, 3, 15000);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const test = JSON.parse(jsonMatch[0]);
    res.json(test);
  } catch (err) {
    handleAIError(err, res, 'Test generation');
  }
});

module.exports = router;