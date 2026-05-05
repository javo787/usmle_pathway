import { NextResponse } from 'next/server';

// ================================================
// Gemini helper — точно как в оригинале
// ================================================
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

// ================================================
// Контекст студента
// ================================================
const STUDENT_CONTEXT = `
Студент: Жаво, 21 йош, 4-курс тиббиёт (Душанбе).
Мақсад: Германияда нейрохирург бўлиш (Facharzt 2029–2035).
Стратегия: Немецкий A1→C1, Anki (тиббий), кафедрада тадқиқот, мақолалар (PubMed), ёз 2025 Hospitation Германияда.
Дин: Мусулмон, намоз ўқийди.
`;

export async function POST(req) {
  try {
    const { type, data } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY топилмади' }, { status: 500 });

    let prompt = '';

    if (type === 'analysis') {
      prompt = `
Сен нейрохирургия йўлидаги тиббиёт талабасининг шахсий AI мураббийсан.
${STUDENT_CONTEXT}
Бугунги маълумотлар:
- 🇩🇪 Немецкий: ${data?.academic?.germanMinutes || 0} мин ${data?.academic?.germanPractice ? '(гаплашди)' : ''}
- 🔁 Anki: ${data?.academic?.ankiDone || 0} карточка
- 🏥 Университет/кафедра: ${data?.academic?.uniHours || 0} соат
- 📄 Мақола: ${data?.academic?.pubHours || 0} соат
- Отделенияда: ${data?.academic?.clinicVisit ? 'Ҳа' : 'Йўқ'}
- Науч.рук: ${data?.academic?.researchMeeting ? 'Ҳа' : 'Йўқ'}
- Намоз: ${data?.spiritual?.prayersDone || 0}/5
- Спорт: ${data?.sport?.didSport ? `Ҳа (${data.sport.type || ''}, ${data.sport.duration || 0} дақ)` : 'Йўқ'}
- Уйқу: ${data?.spiritual?.sleepOnTime ? 'Вақтида' : 'Кеч'}
- Қўшимча: "${data?.userInput || ''}"
JSON форматда жавоб бер:
{ "score": <1-10>, "good": "<Ўзбек>", "bad": "<Ўзбек>", "tomorrow": "<Ўзбек>" }`;
    }

    else if (type === 'plan') {
      prompt = `
Сен Germany Path учун продуктивлик стратегисан.
${STUDENT_CONTEXT}
Режа:
Жадвал: ${data?.schedule || 'йўқ'}
Тақиқлар: ${data?.prohibitions || 'йўқ'}
Вазифалар: ${JSON.stringify(data?.tomorrowPlans?.filter(t => t?.trim()) || [])}
JSON: { "rating": "<X/10>", "critique": "<Ўзбек>", "suggestion": "<Ўзбек>" }`;
    }

    else if (type === 'chat') {
      prompt = `
Сен нейрохирургия йўлидаги талабанинг AI мураббийсан.
${STUDENT_CONTEXT}
Савол: "${data?.userInput}"
Қисқа, лўнда жавоб (Ўзбек Кирилл, 3-5 жумла).
JSON: { "text": "<жавоб>" }`;
    }

    else if (type === 'language') {
      const langMap = { english: 'English', german: 'German (Deutsch)', arabic: 'Arabic (العربية)' };
      const lang = langMap[data?.selectedLang] || 'German (Deutsch)';
      prompt = `
You are a strict ${lang} tutor for a medical student targeting Germany.
Student wrote: "${data?.userInput || ''}"
JSON only:
{
  "level": "<CEFR>",
  "corrected": "<corrected in ${lang}>",
  "feedback": "<Ўзбек Кирилл>",
  "tip": "<Ўзбек Кирилл>",
  "newWord": "<medical word in ${lang}>",
  "newWordMeaning": "<Ўзбекча>"
}`;
    }

    else if (type === 'podcast') {
      prompt = `
You are an Islamic Medical Mentor for a student targeting neurosurgery in Germany.
${STUDENT_CONTEXT}
Current state: Mood ${data.mood}/5, Energy ${data.energy}/5, Score ${data.score}%, Debt ${data.penaltyDebt} somoni.
German today: ${data?.academic?.germanMinutes || 0} min, Anki: ${data?.academic?.ankiDone || 0} cards.
Recommend ONE specific topic to listen to now (motivational OR educational).
JSON only:
{
  "title": "Short catchy title",
  "reason": "Empathetic advice — Uzbek Cyrillic.",
  "searchQuery": "YouTube search query in English"
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
