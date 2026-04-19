import { NextResponse } from 'next/server';

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

async function callGemini(apiKey, prompt) {
  const res = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

function parseJSON(text) {
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(clean); } catch { return { text: clean }; }
}

export async function POST(req) {
  try {
    const { type, data } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY топилмади' }, { status: 500 });

    let prompt = '';

    // ================================================
    // 1. КУН ТАҲЛИЛИ
    // ================================================
    if (type === 'analysis') {
      prompt = `
Сен USMLE тайёрланаётган тиббиёт талабасининг шахсий AI мураббийсан.
Бугунги маълумотлар:
- UWorld: ${data?.academic?.uWorldDone || 0} та савол
- First Aid: ${data?.academic?.firstAidDone || 0} бет
- Anki: ${data?.academic?.ankiDone || 0} карточка
- Намоз: ${data?.spiritual?.prayersDone || 0}/5
- Спорт: ${data?.sport?.didSport ? `Ҳа (${data.sport.type || ''}, ${data.sport.duration || 0} дақ)` : 'Йўқ'}
- Зикр: ${data?.spiritual?.zikrs ? data.spiritual.zikrs.reduce((s,z)=>s+z.count,0) : 0} та
- Уйқу: ${data?.spiritual?.sleepOnTime ? 'Вақтида' : 'Кеч'}
- Қўшимча: "${data?.userInput || ''}"

Қуйидаги JSON форматда жавоб бер (бошқа ҳеч нарса ёзма):
{
  "score": <1дан 10гача бутун сон>,
  "good": "<нима яхши бўлди — 1-2 жумла, Ўзбек Кирилл>",
  "bad": "<нима ёмон ва нега — 1-2 жумла, Ўзбек Кирилл>",
  "tomorrow": "<эртага 1 та конкрет ўзгартириш — Ўзбек Кирилл>"
}`;
    }

    // ================================================
    // 2. РЕЖА ТЕКШИРУВИ
    // ================================================
    else if (type === 'plan') {
      prompt = `
Сен продуктивлик стратегисан. Бу режани баҳола:
Вазифалар: ${JSON.stringify(data?.tomorrowPlans?.filter(t=>t?.trim()))}
Қўшимча: "${data?.userInput || ''}"

JSON форматда жавоб бер:
{
  "rating": "<X/10>",
  "critique": "<режа реалистикми, муаммолар — Ўзбек Кирилл>",
  "suggestion": "<1 та конкрет ўзгартириш — Ўзбек Кирилл>"
}`;
    }

    // ================================================
    // 3. ЭРКИН САВОЛ
    // ================================================
    else if (type === 'chat') {
      prompt = `
Сен USMLE талабасининг дўстона AI мураббийсан. Савол:
"${data?.userInput}"

Контекст: UWorld ${data?.academic?.uWorldDone || 0} та, балл ${data?.score || 0}%.
Қисқа, лўнда, амалий жавоб бер (Ўзбек Кирилл, 3-5 жумла).
JSON: { "text": "<жавоб>" }`;
    }

    // ================================================
    // 4. ТИЛ МАШҚИ
    // ================================================
    else if (type === 'language') {
      const langMap = { english: 'English', german: 'German (Deutsch)', arabic: 'Arabic (العربية)' };
      const lang = langMap[data?.selectedLang] || 'English';
      const text = data?.userInput || '';

      prompt = `
You are a strict but friendly ${lang} tutor for a medical student.
Student wrote in ${lang}: "${text}"

Respond ONLY in JSON (no markdown):
{
  "level": "<CEFR level: A1/A2/B1/B2/C1/C2>",
  "corrected": "<corrected version of their sentence in ${lang}>",
  "feedback": "<what was wrong or good — explain in Uzbek Cyrillic (Ўзбекча)>",
  "tip": "<one grammar or vocabulary tip — in Uzbek Cyrillic>",
  "newWord": "<one useful ${lang} word related to medicine or their sentence>",
  "newWordMeaning": "<meaning of that word in Uzbek>"
}`;
    }

    // ================================================
    // 5. ПОДКАСТ (эски логика сақланди)
    // ================================================
    else if (type === 'podcast') {
      prompt = `
You are an Islamic Medical Mentor for a student preparing for USMLE.
Mood: ${data.mood}/5, Energy: ${data.energy}/5, Score: ${data.score}%, Debt: ${data.penaltyDebt} somoni.
Recommend ONE topic to listen to right now.
Output JSON only:
{
  "title": "Short catchy title",
  "reason": "Empathetic advice in Uzbek Cyrillic.",
  "searchQuery": "YouTube search query"
}`;
    }

    else {
      return NextResponse.json({ error: 'Нотўғри тип' }, { status: 400 });
    }

    const raw = await callGemini(apiKey, prompt);
    const result = parseJSON(raw);
    return NextResponse.json(result);

  } catch (err) {
    console.error('AI Coach Error:', err);
    return NextResponse.json({ error: err.message || 'AI хатоси' }, { status: 500 });
  }
}
