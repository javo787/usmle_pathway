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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Сен Жаво учун шахсий AI коуч — у 4-курс тиббиёт студенти (Тошкент/Душанбе), нейрохирург бўлишни мақсад қилган.

Унинг стратегияси:
- Германияда Facharzt нейрохирургия олиш (2029–2035)
- Ҳозир немецкий ўрганяпти (A1-A2), мақсад B2 → C1 Medizin
- Anki билан тиббий атамалар ўрганади
- Кафедрада илмий тадқиқотда иштирок этади
- Мақолалар ёзяпти (PubMed indexed)
- Лето 2027-да Германияда Hospitation режалаштираяпти
- Мусулмон, намоз ўқийди, рўзаларга риоя қилади

Коучинг стили:
- Қисқа, аниқ, реалистик
- Ўзбек/Тожик тилида ёки русча (у нима ёзса, шунда жавоб бер)
- Уни мақта эмас — конкрет маслаҳат бер
- Агар план сустлигини кўрсанг — очиқ айт`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, data, userMessage, language } = body;

    let userContent = '';

    if (type === 'plan') {
      userContent = `Бугунги режам:
Жадвал: ${data.schedule || 'йўқ'}
Тақиқлар: ${data.prohibitions || 'йўқ'}
Эртанга: ${(data.tomorrowPlans || []).filter(Boolean).join(', ') || 'йўқ'}

Бугунги натижалар:
- Немецкий: ${data.germanMinutes || 0} мин ${data.germanPractice ? '(гаплашдим)' : ''}
- Anki: ${data.ankiDone || 0} карта
- Универ: ${data.uniHours || 0} соат ${data.clinicVisit ? '(отделенияда бўлдим)' : ''}
- Мақола: ${data.pubHours || 0} соат

Режани баҳола ва 2-3 конкрет маслаҳат бер.`;

    } else if (type === 'analysis') {
      userContent = `Кунлик таҳлил:
Немецкий: ${data.germanMinutes || 0} мин
Anki: ${data.ankiDone || 0} карта
Университет: ${data.uniHours || 0} соат
Мақола: ${data.pubHours || 0} соат
Спорт: ${data.sport?.didSport ? 'Бажарилди' : 'Йўқ'}
Намоз: ${data.spiritual?.prayersDone || 0}/5

Нима яхши, нима ёмон? Эртага нимани ўзгартириш керак?`;

    } else if (type === 'language') {
      const langMap = { english: 'English', german: 'German', arabic: 'Arabic' };
      const targetLang = langMap[language] || 'German';
      userContent = `Тил машқи (${targetLang}). Ушбу матнни текшир ва тузат:\n\n"${userMessage}"\n\nХатоларни изоҳла, тўғри вариантини кўрсат.`;

    } else if (type === 'chat') {
      userContent = userMessage || 'Саволим йўқ';

    } else {
      userContent = userMessage || 'Маслаҳат бер';
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content.map(b => b.text || '').join('');
    return Response.json({ result: text });

  } catch (err) {
    console.error('ai-coach error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
