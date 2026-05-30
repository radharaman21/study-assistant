const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

//////////////////////////////////////////////////////////////////
// 🔥 Groq Helper
//////////////////////////////////////////////////////////////////

async function generateFromLLM(messages) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages:messages,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }

    );

    return res.data.choices[0].message.content;

  } catch (err) {
    console.error("GROQ ERROR:", err.response?.data || err.message);
    throw err;
  }
}

//////////////////////////////////////////////////////////////////
// 🔥 Helpers (same structure)
//////////////////////////////////////////////////////////////////

async function callWithRetry(fn, retries = 3, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < retries - 1) {
        console.log("Retrying...");
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
}

function buildSystemPrompt(user) {
  const p = user.profile || {};
  return `You are an expert AI tutor.

Student:
- Name: ${user.name}
- Course: ${p.course}
- Level: ${p.learningLevel}
- Subjects: ${p.subjects?.join(', ') || 'General'}

Explain clearly and simply.`;
}

function handleAIError(err, res, context) {
  console.error(`${context} ERROR:`, err.message);
  res.status(500).json({ message: `${context} failed` });
}

function parseJSON(text) {
  try {
    // remove markdown if present
    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // extract JSON part
    const match = cleaned.match(/\[.*\]|\{[\s\S]*\}/);

    if (!match) {
      console.log("❌ RAW AI RESPONSE:", text);
      throw new Error("No JSON found");
    }

    return JSON.parse(match[0]);

  } catch (err) {
    console.log("❌ RAW AI RESPONSE:", text);
    throw new Error("AI format error");
  }
}

//////////////////////////////////////////////////////////////////
// 📌 CHAT
//////////////////////////////////////////////////////////////////
router.post('/chat', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let incoming = req.body.messages;

    // ✅ FORCE ARRAY
    if (!Array.isArray(incoming)) {
      console.log("❌ messages not array:", incoming);
      incoming = [];
    }

    // ✅ CLEAN MESSAGES
    const safeMessages = incoming
      .map(m => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: typeof m?.content === "string" ? m.content.trim() : ""
      }))
      .filter(m => m.content.length > 0);

    // ✅ FINAL ARRAY (IMPORTANT)
    const finalMessages = [
      { role: "system", content: buildSystemPrompt(user) },
      ...safeMessages
    ];

    // 🔥 DEBUG (VERY IMPORTANT)
    console.log("📤 SENDING TO GROQ:", finalMessages);
    console.log("📦 TYPE:", typeof finalMessages, Array.isArray(finalMessages));

    // ✅ CALL LLM
    const reply = await generateFromLLM(finalMessages);

    res.json({ reply });

  } catch (err) {
    console.log("❌ CHAT ERROR FULL:", err.response?.data || err.message);
    res.status(500).json({ message: "Chat failed" });
  }
});
//////////////////////////////////////////////////////////////////
// 📌 QUIZ
//////////////////////////////////////////////////////////////////

router.post('/quiz', protect, async (req, res) => {
  try {
    const { subject, topic, numQuestions = 5 } = req.body;
    const user = await User.findById(req.user._id);

    mpt = `Generate ${numQuestions} MCQs on ${topic} in ${subject}.
Return ONLY JSON.`

    const text = await callWithRetry(() =>
      generateFromLLM([
        { role: "system", content: buildSystemPrompt(user) },
        { role: "user", content: prompt }
      ])
    );

    const quiz = parseJSON(text);

    res.json(quiz);

  } catch (err) {
    handleAIError(err, res, 'Quiz');
  }
});

/////////////////const pro/////////////////////////////////////////////////
// 📌 STUDY PLAN
//////////////////////////////////////////////////////////////////

router.post('/study-plan', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const p = user.profile || {};

    const prompt = `Create a 7-day study plan.

Student: ${user.name}
Course: ${p.course}
Level: ${p.learningLevel}
Subjects: ${p.subjects?.join(', ')}

Return ONLY JSON.`;

    const text = await callWithRetry(() =>
      generateFromLLM([
        { role: "system", content: "Your study planner." },
        { role: "user", content: prompt }
      ])
    );
    console.log("🔥🔥 RAW AI RESPONSE START 🔥🔥");
    console.log(text);
    console.log("🔥🔥 RAW AI RESPONSE END 🔥🔥");

    const plan = parseJSON(text);

    await User.findByIdAndUpdate(req.user._id, {
      studyPlan: plan
    });

    //res.json(plan);
    /*res.json({
        studyPlan: cleanPlan.StudyPlan
    });*/
    const cleanPlan = Object.values(plan)[0];

    res.json({
        StudyPlan: cleanPlan.StudyPlan || cleanPlan
    });

  }catch (err) {
  console.log("🔥 STUDY PLAN ERROR FULL:", err);
  console.log("🔥 RESPONSE DATA:", err.response?.data);

  res.status(500).json({
    message: err.message,
    error: err.response?.data
  });
}

});

//////////////////////////////////////////////////////////////////
// 📌 Chat
//////////////////////////////////////////////////////////////////
router.post('/chat', protect, async (req, res) => {
  try {
    const raw = Array.isArray(req.body.messages) ? req.body.messages : [];
    const user = await User.findById(req.user._id);

    // ✅ 1. Normalize + sanitize
    const safeMessages = raw
      .map(m => {
        const role = m?.role === 'assistant' ? 'assistant' : 'user';
        const content = (typeof m?.content === 'string' ? m.content : '').trim();
        return { role, content };
      })
      .filter(m => m.content.length > 0); 

    if (safeMessages.length === 0) {
      return res.status(400).json({ message: "No valid messages" });
    }

    // ✅ 2. System prompt ALWAYS first
    const finalMessages = [
      { role: 'system', content: buildSystemPrompt(user) },
      ...safeMessages
    ];

    console.log("📥 FINAL MESSAGES SENT TO LLM:", finalMessages);

    // ❗ IMPORTANT: ensure your groq util uses `messages`
    const reply = await callWithRetry(() =>
      generateFromLLM({ messages: finalMessages })
    );

    res.json({ reply });

  } catch (err) {
    console.log("❌ CHAT ERROR FULL:", err?.response?.data || err.message);
    res.status(500).json({ message: "Chat failed" });
  }
});

/*router.post('/chat', protect, async (req, res) => {
  try {
    const { messages } = req.body; // 👈 full chat history
    const user = await User.findById(req.user._id);

   const safeMessages = messages
  .filter(m => m && m.content) // ❗ remove invalid
  .map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content)
  }));

    const response = await callWithRetry(() =>
    generateFromLLM([
        { role: "system", content: buildSystemPrompt(user) },
        ...safeMessages
    ])
);

    res.json({ reply: response });

  } catch (err) {
    handleAIError(err, res, 'Chat');
  }
});*/

//////////////////////////////////////////////////////////////////
// 📌 TEST
//////////////////////////////////////////////////////////////////

router.post('/test', protect, async (req, res) => {
  try {
    const { subject, numQuestions = 10 } = req.body;
    const user = await User.findById(req.user._id);

    const prompt = `Generate ${numQuestions} questions test for ${subject}.
Return ONLY JSON.`;

    const text = await callWithRetry(() =>
      generateFromLLM([
        { role: "system", content: buildSystemPrompt(user) },
        { role: "user", content: prompt }
      ])
    );

    const test = parseJSON(text);

    res.json(test);

  } catch (err) {
    handleAIError(err, res, 'Test');
  }
});

module.exports = router;