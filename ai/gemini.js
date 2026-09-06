const { GoogleGenerativeAI } = require("@google/generative-ai");

// ВАЖНО: gemini-2.5-flash — reasoning ("thinking") модель. Токены на
// внутреннее рассуждение (thoughtsTokenCount в usageMetadata) списываются
// из ТОГО ЖЕ бюджета maxOutputTokens, что и видимый текст ответа. Без
// явного thinkingConfig модель сама решает, сколько "думать", и на
// нетривиальных промптах может съедать 90-98% бюджета на невидимые
// рассуждения — снаружи это выглядит как "ответ обрезан", хотя лимит
// Telegram (4096 символов) тут вообще ни при чём. Поэтому thinking
// явно выключен (thinkingBudget: 0), а maxOutputTokens поднят с запасом.
// Подробности: https://ai.google.dev/gemini-api/docs/thinking
function createGemini(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  async function callGemini(prompt) {
    const result = await model.generateContent(prompt);

    const finishReason = result.response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      // Если это когда-нибудь снова случится — будет видно в логах,
      // а не тихо обрежется без следа.
      console.warn(
        `[gemini] finishReason=${finishReason}`,
        result.response.usageMetadata
          ? JSON.stringify(result.response.usageMetadata)
          : ""
      );
    }

    return result.response.text().trim();
  }

  return { callGemini, model };
}

module.exports = createGemini;
