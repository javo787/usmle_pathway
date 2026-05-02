// app/api/ai-coach/route.js
// Полностью заменить файл

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Сен Жаво учун шахсий AI коуч — у 4-курс тиббиёт студенти (Тошкент/Душанбе), нейрохирург бўлишни мақсад қилган.

Унинг стратегияси:
- Германияда Facharzt нейрохирургия олиш (2029–2035)
- Ҳозир немецкий ўрганяпти (A1-A2), мақсад B2 → C1 Medizin
- Anki билан тиббий атамалар ўрганади
- Кафедрада илмий тадқиқотда иштирок этади
- Мақолалар ёзяпти (PubMed indexed)
- Лето 2025-да Германияда Hospitation режалаштираяпти
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
