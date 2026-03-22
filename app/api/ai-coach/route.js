import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { type, data } = await req.json(); 
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key топилмади. .env.local файлини текширинг." }, { status: 500 });
    }

    let systemPrompt = "";
    
    // 1. ПОДКАСТ МЕНТОРИ (Ўзбекча Кирилл)
    if (type === 'podcast') {
      systemPrompt = `
        You are an Islamic Medical Mentor for a student preparing for USMLE.
        User Status:
        - Mood: ${data.mood}/5
        - Energy: ${data.energy}/5
        - Recent Score: ${data.score}%
        - Debt: ${data.penaltyDebt} somoni
        
        Based on this, recommend ONE specific topic (Islamic or Medical/Productivity) to listen to right now.
        
        IMPORTANT: The 'reason' MUST be in **Uzbek language using Cyrillic script** (Ўзбек тили, Кирилл).
        
        Output JSON only:
        {
          "title": "Short catchy title",
          "reason": "Empathetic advice in Uzbek Cyrillic.",
          "searchQuery": "YouTube search query for this topic"
        }
      `;
    } 
    // 2. РЕЖА СТРАТЕГИ (Ўзбекча Кирилл)
    else if (type === 'plan') {
      systemPrompt = `
        You are a Productivity Strategist. Review this daily plan:
        Schedule: "${data.schedule}"
        Top 3 Tasks: ${JSON.stringify(data.tomorrowPlans?.slice(0,3))}
        
        Critique this plan. Is it realistic? Too easy?
        
        IMPORTANT: The 'critique' and 'suggestion' MUST be in **Uzbek language using Cyrillic script** (Ўзбек тили, Кирилл).
        
        Output JSON only:
        {
          "rating": "X/10",
          "critique": "Brutal but helpful feedback in Uzbek Cyrillic.",
          "suggestion": "One specific change in Uzbek Cyrillic."
        }
      `;
    }
    // 3. AI МУРАББИЙ (General Chat/Advice)
    else if (type === 'general') {
       systemPrompt = `
        Сиз тиббиёт талабаси учун 'AI Мураббий'сиз.
        Сана: ${data.date}. Натижа: ${data.score}%.
        Қилинаётган ишлар: First Aid (${data.academic?.firstAidDone}), UWorld (${data.academic?.uWorldDone}).
        Руҳий: Намоз (${data.spiritual?.prayersDone}), Нафс (${data.spiritual?.nafsRelapse ? 'Срыв' : 'Тоза'}).
        Таҳлил: "${data.reflection}".
        
        Шуларга асосланиб, қисқа, лўнда ва фойдали маслаҳат беринг (Ўзбек тили, Кирилл).
       `;
    }

    // ТЎҒРИ МОДЕЛ: gemini-1.5-flash (энг барқарор) ёки gemini-2.0-flash-exp (янги)
    // Биз 1.5 ишлатамиз, чунки у 100% ишлайди. 2.5 ҳали йўқ.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const apiData = await response.json();
    
    if (apiData.error) {
        throw new Error(apiData.error.message);
    }

    // Жавобни олиш
    const aiText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Агар JSON кутаётган бўлсак (Podcast/Plan учун)
    if (type === 'podcast' || type === 'plan') {
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(cleanJson));
    }

    // Оддий текст учун
    return NextResponse.json({ text: aiText });

  } catch (error) {
    console.error("AI Coach Error:", error);
    return NextResponse.json({ error: error.message || "AI brain freeze" }, { status: 500 });
  }
}
