const { GoogleGenerativeAI } = require("@google/generative-ai");

function createGemini(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
  });

  async function callGemini(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  return { callGemini, model };
}

module.exports = createGemini;
