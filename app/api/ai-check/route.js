import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key not found. Please add GEMINI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Промпт для AI
    const systemPrompt = `
      You are a strict English tutor for a medical student. 
      Analyze the following text: "${text}"
      
      Output ONLY a JSON object with these 3 fields:
      1. level: Estimated CEFR level (A1, A2, B1, B2, C1, C2).
      2. feedback: A short verification of grammar and vocabulary.
      3. tip: One actionable tip to improve.
      
      Do not use Markdown formatting (no \`\`\`json). Just raw JSON.
    `;

    // Запрос к Google Gemini API (REST)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    
    // Обработка ответа
    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    // Очистка от маркдауна, если AI вдруг его добавил
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (e) {
      // Если AI вернул просто текст, а не JSON
      result = { 
        level: "N/A", 
        feedback: aiText, 
        tip: "Could not parse detailed stats." 
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: "Failed to check text. " + error.message },
      { status: 500 }
    );
  }
}
