const axios = require("axios");

const GEMINI_API = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

async function generateFromGemini(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_API}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } catch (err) {
    console.log("GEMINI ERROR:", err.response?.data || err.message);
    throw new Error("AI generation failed");
  }
}

module.exports = { generateFromGemini };