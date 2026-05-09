require('dotenv').config({ path: '.env.local' });
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const http = require('http');

// ==========================================
// 1. КОНФИГУРАЦИЯ
// ==========================================
const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  // Telegram ID -> masterEmail маппинг (синхронизирован с getMasterEmail.js сайта)
  userMap: {
    [process.env.TELEGRAM_USER_ID]: 'javo.nur.2004@gmail.com',  // Жаво
    '8383611951': 'javo.nur.2004@gmail.com',
    '5909296696': 'javo.nur.2004@gmail.com',   // Партнёр — тот же аккаунт!
  },
  mongoUri: process.env.MONGODB_URI,
  geminiKey: process.env.GEMINI_API_KEY,
  apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
  apiHash: process.env.TELEGRAM_API_HASH,
  userbotSession: process.env.USERBOT_SESSION,
  nukeContacts: (process.env.NUKE_CONTACTS || "").split(',').filter(Boolean),
  timezone: "Asia/Tashkent",
};

// Список разрешённых Telegram ID (из userMap)
const ALLOWED_TG_IDS = Object.keys(CONFIG.userMap).filter(Boolean);

if (!CONFIG.botToken || !CONFIG.mongoUri || !ALLOWED_TG_IDS.length) {
  console.error("❌ ХАТО: TELEGRAM_BOT_TOKEN, MONGODB_URI ёки TELEGRAM_USER_ID йўқ!");
  process.exit(1);
}

// ==========================================
// 2. БАЗА ДАННЫХ — точная схема сайта
// ==========================================
mongoose.connect(CONFIG.mongoUri)
  .then(() => console.log("✅ MongoDB уланди"))
  .catch(err => { console.error("❌ MongoDB:", err.message); process.exit(1); });

// ВАЖНО: схема полностью совпадает с /models/DayLog.js сайта
const DayLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },  // masterEmail, не Telegram ID!
  date:   { type: String, required: true },

  planning: {
    schedule:      { type: String, default: '' },
    prohibitions:  { type: String, default: '' },
    tomorrowPlans: [{ type: String }],
    reflection:    { type: String, default: '' },
  },

  academic: {
    firstAidDone:       { type: Number,  default: 0     },
    uWorldDone:         { type: Number,  default: 0     },
    ankiDone:           { type: Number,  default: 0     },
    repetition:         { type: Boolean, default: false },
    additionalResource: { type: Boolean, default: false },
    // Дополнительные поля для Germany Path (strict:false позволяет)
    germanMinutes: { type: Number, default: 0 },
    germanPractice:{ type: Boolean,default: false },
    uniHours:      { type: Number, default: 0 },
    pubHours:      { type: Number, default: 0 },
    clinicVisit:   { type: Boolean,default: false },
    researchMeeting:{type: Boolean,default: false },
  },

  spiritual: {
    prayersDone:  { type: Number,  default: 0     },
    prayers:      { type: mongoose.Schema.Types.Mixed, default: {} },
    tahajjud:     { type: Boolean, default: false },
    zikr:         { type: Boolean, default: false },
    zikrs:        { type: mongoose.Schema.Types.Mixed, default: [] },
    quranPages:   { type: Number,  default: 0     },
    quranNote:    { type: String,  default: ''    },
    sleepOnTime:  { type: Boolean, default: false },
    nafsRelapse:  { type: Boolean, default: false },
    qazoDone:     { type: Boolean, default: false },
    zulm:         { type: String,  default: ''    },
    sadaqa:       { type: Boolean, default: false },
    silaiRahm:    { type: Boolean, default: false },
  },

  english: {
    practiced:  { type: Boolean, default: false },
    essay:      { type: String,  default: ''    },
    aiFeedback: { type: String,  default: ''    },
  },

  sport: {
    didSport:  { type: Boolean, default: false },
    type:      { type: String,  default: ''    },
    duration:  { type: Number,  default: 0     },
    details:   { type: String,  default: ''    },
    intensity: { type: String,  default: ''    },
  },

  // Ядерный протокол — совпадает с сайтом
  penaltyDebt:    { type: Number,  default: 0    },
  debtCreatedAt:  { type: Date,    default: null },
  warning20hSent: { type: Boolean, default: false },
  warning12hSent: { type: Boolean, default: false }, // доп. уровень
  nukeTriggered:  { type: Boolean, default: false },

  score:       { type: Number, default: 0 },
  lastUpdated: { type: Date,   default: Date.now },

  // Поля ТОЛЬКО для бота (сайт их не трогает, strict:false)
  hourlyResponses: [{
    time:       String,
    hour:       Number,
    text:       String,
    aiReaction: String,
    savedAt:    Date
  }],
  questionPending:     { type: Boolean, default: false },
  currentQuestionHour: { type: Number,  default: null  },
  streak:              { type: Number,  default: 0     },

}, { timestamps: true, strict: false });

DayLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DayLog = mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);

// UserProfile — для синхронизации penaltyDebt с сайтом
const UserProfileSchema = new mongoose.Schema({
  masterEmail:   { type: String, required: true, unique: true, lowercase: true },
  linkedEmails:  [{ type: String }],
  displayName:   { type: String, default: '' },
  settings: {
    enableNotifications: { type: Boolean, default: false },
    smallReward: { type: String, default: '+50с ҳалол!' },
    bigReward:   { type: String, default: 'Германияга бориш' },
    punishment:  { type: String, default: '50с Эҳсон' },
  },
  goals: {
    germanMinutes: { type: Number, default: 45 },
    anki:          { type: Number, default: 50 },
    uniHours:      { type: Number, default: 4  },
  },
  challenges:    [mongoose.Schema.Types.Mixed],
  penaltyDebt:   { type: Number, default: 0    },
  debtCreatedAt: { type: Date,   default: null  },
}, { timestamps: true, strict: false });

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ
// ==========================================
const bot = new TelegramBot(CONFIG.botToken, { polling: true });

const genAI = new GoogleGenerativeAI(CONFIG.geminiKey);
const aiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
});

let userbot;
(async () => {
  if (CONFIG.apiId && CONFIG.apiHash && CONFIG.userbotSession) {
    const stringSession = new StringSession(CONFIG.userbotSession);
    userbot = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, { connectionRetries: 5 });
    await userbot.connect();
    console.log("☢️ Юзербот (Ядерный протокол) активен");
  } else {
    console.log("⚠️ Юзербот не настроен");
  }
})();

console.log(`🤖 Medical Brother v6.0 (сайт билан тўлиқ интеграция)`);
console.log(`👥 Telegram IDs: ${ALLOWED_TG_IDS.join(', ')}`);

// ==========================================
// 4. УТИЛИТЫ
// ==========================================
const getTashkentDate = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: CONFIG.timezone }));

const getToday = () => {
  const d = getTashkentDate();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getTashkentHour = () => getTashkentDate().getHours();
const getTashkentTime = () => {
  const d = getTashkentDate();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const DAY_NAMES = ['Якшанба','Душанба','Сешанба','Чоршанба','Пайшанба','Жума','Шанба'];

// Telegram ID -> masterEmail (как на сайте)
const getMasterEmail = (tgId) => CONFIG.userMap[tgId.toString()] || null;

const isAllowed = (tgId) => !!getMasterEmail(tgId.toString());

const safeSend = async (chatId, text, options = {}) => {
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
  } catch (err) {
    console.error(`Send error to ${chatId}:`, err.message);
    return null;
  }
};

// Получить/создать лог по masterEmail (как на сайте!)
async function getOrCreateLog(masterEmail) {
  const date = getToday();
  let log = await DayLog.findOne({ userId: masterEmail, date });
  if (!log) {
    log = new DayLog({
      userId: masterEmail,
      date,
      hourlyResponses: [],
      academic: {}, spiritual: {}, sport: {}, english: {}, planning: {},
    });
    await log.save();
  }
  return log;
}

// Синхронизировать penaltyDebt в UserProfile (как делает сайт через /api/journal)
async function syncDebtToProfile(masterEmail, penaltyDebt, debtCreatedAt) {
  try {
    await UserProfile.findOneAndUpdate(
      { masterEmail },
      { $set: { penaltyDebt, debtCreatedAt: debtCreatedAt || null } },
      { upsert: true }
    );
  } catch (e) {
    console.error("syncDebtToProfile error:", e.message);
  }
}

async function callGemini(prompt) {
  const result = await aiModel.generateContent(prompt);
  return result.response.text().trim();
}

function splitMessage(text, maxLen = 3800) {
  const parts = [];
  const lines = text.split('\n');
  let current = '';
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLen) {
      if (current) parts.push(current.trimEnd());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) parts.push(current.trimEnd());
  return parts.length ? parts : [text];
}

// ==========================================
// 5. КЛАВИАТУРА
// ==========================================
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['📊 Статус', '📝 Жавоблар'],
      ['🤲 Намоз +1', '💀 Срыв'],
      ['💰 Қарз', '🧠 AI Таҳлил'],
      ['🏆 Стрик', '❓ Ёрдам']
    ],
    resize_keyboard: true
  }
};

// ==========================================
// 6. CRON: ПОЧАСОВЫЕ ВОПРОСЫ (ИСПРАВЛЕННЫЙ cron!)
// ==========================================
cron.schedule('0 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22 * * *', async () => {
  const hour = getTashkentHour();
  const time = getTashkentTime();

  let question;
  if (hour < 9)       question = `🌅 *${time}* — Субҳ вақти!\n\n*Нима билан бошладингиз? Максадга биринчи қадам қўйдингизми?* 🎯\n\nЖавобингизни ёзинг.`;
  else if (hour < 13) question = `⚡ *${time}* — Тонгги самара!\n\n*Нима қилавоссиз? Немецкий/Anki/Универ — қайси бирида?* 📚\n\nЖавобингизни ёзинг.`;
  else if (hour < 16) question = `☀️ *${time}* — Тушлик кейин...\n\n*Максад томон кетавоссизми? Ёки нафс ютдими?* 💪\n\nЖавобингизни ёзинг.`;
  else if (hour < 19) question = `🌆 *${time}* — Кечқурун!\n\n*Кун режаси бажарилмоқдами?* 📋\n\nЖавобингизни ёзинг.`;
  else                question = `🌙 *${time}* — Кун якунлашмоқда...\n\n*Бугун нима ютдингиз? Нима кам бўлди?* 🤔\n\nЖавобингизни ёзинг.`;

  for (const tgId of ALLOWED_TG_IDS) {
    const masterEmail = getMasterEmail(tgId);
    if (!masterEmail) continue;
    try {
      const log = await getOrCreateLog(masterEmail);
      log.questionPending = true;
      log.currentQuestionHour = hour;
      await log.save();
      await safeSend(tgId, question);
    } catch (e) {
      console.error(`Hourly poll error [${tgId}]:`, e.message);
    }
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 7. CRON: УТРЕННЕЕ ПРИВЕТСТВИЕ (05:55)
// ==========================================
cron.schedule('55 5 * * *', async () => {
  const day = DAY_NAMES[getTashkentDate().getDay()];
  // Берём цели из UserProfile (как установлено на сайте)
  const profile = await UserProfile.findOne({ masterEmail: 'javo.nur.2004@gmail.com' });
  const goals = profile?.goals || { germanMinutes: 45, anki: 50, uniHours: 4 };

  const msg = `🌅 *Ассаламу алайкум! ${day} муборак!*\n\n📋 *Бугунги мақсадлар:*\n🇩🇪 Немецкий — ${goals.germanMinutes}+ дақиқа\n🔁 Anki — ${goals.anki}+ карточка\n🏥 Универ/Кафедра — ${goals.uniHours}+ соат\n🤲 Намоз — 5 вақт\n🏃 Спорт — ҳаракат\n\n_Нейрохирургия сени кутяпти, доктор!_ 💪`;

  for (const tgId of ALLOWED_TG_IDS) {
    await safeSend(tgId, msg);
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 8. CRON: НОЧНОЙ AI-АНАЛИЗ (22:05)
// ==========================================
cron.schedule('5 22 * * *', async () => {
  // Один анализ на masterEmail (оба пользователя видят одно)
  const masterEmail = 'javo.nur.2004@gmail.com';
  try {
    const log = await DayLog.findOne({ userId: masterEmail, date: getToday() });

    if (!log || !log.hourlyResponses || log.hourlyResponses.length === 0) {
      for (const tgId of ALLOWED_TG_IDS) {
        await safeSend(tgId, `📊 *Кунлик таҳлил*\n\n😔 Бугун жавоб берилмади.\nЭртага ҳар соатда жавоб беринг!`);
      }
      return;
    }

    for (const tgId of ALLOWED_TG_IDS) {
      await safeSend(tgId, `🧠 *AI таҳлил тайёрланмоқда...*\n📝 ${log.hourlyResponses.length} та жавоб`);
    }

    const responsesList = log.hourlyResponses
      .sort((a, b) => a.hour - b.hour)
      .map(r => `• ${r.time} — "${r.text}"`)
      .join('\n');

    const prompt = `Сен Жавоҳирнинг шахсий AI-коучисан. У 4-курс тиббиёт студенти, мақсади — Германияда нейрохирург бўлиш.

Бугунги соатлик жавоблар:
${responsesList}

Сайтдаги кун статистикаси:
📊 Балл: ${log.score || 0}%
🔁 Anki: ${log.academic?.ankiDone || 0} карта
🤲 Намоз: ${log.spiritual?.prayersDone || 0}/5
🏃 Спорт: ${log.sport?.didSport ? 'Ҳа' : 'Йўқ'}
🌙 Тоҳажжуд: ${log.spiritual?.tahajjud ? 'Ҳа' : 'Йўқ'}
📖 Қуръон: ${log.spiritual?.quranPages || 0} бет

JSON форматда чуқур таҳлил:
{
  "mood_curve": "кун давомида руҳий ҳолат",
  "peak_hours": "энг самарали соатлар",
  "low_hours": "сустлик соатлари ва сабаби",
  "real_progress": "ҳақиқий прогресс — очиқ баҳо",
  "problems": "аниқланган муаммолар",
  "tomorrow_plan": "эртага 3 та конкрет қадам",
  "score": <1-10 сон>,
  "motivation": "якуний мотивациявий сўз (2 жумла)"
}
ФАҚАТ JSON.`;

    const raw = await callGemini(prompt);
    let a;
    try {
      a = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      for (const tgId of ALLOWED_TG_IDS) {
        await safeSend(tgId, `📊 *Кунлик таҳлил:*\n\n${raw}`);
      }
      return;
    }

    const scoreEmoji = a.score >= 8 ? '🏆' : a.score >= 6 ? '✅' : a.score >= 4 ? '⚠️' : '❌';
    const message =
      `📊 *КУНЛИК AI ТАҲЛИЛ*\n\n` +
      `${scoreEmoji} *Кун баҳоси: ${a.score}/10*\n\n` +
      `🧠 *Руҳий ҳолат:*\n${a.mood_curve}\n\n` +
      `⚡ *Самарали соатлар:*\n${a.peak_hours}\n\n` +
      `🔻 *Сустлик:*\n${a.low_hours}\n\n` +
      `🎯 *Ҳақиқий прогресс:*\n${a.real_progress}\n\n` +
      `⚠️ *Муаммолар:*\n${a.problems}\n\n` +
      `📋 *Эртага:*\n${a.tomorrow_plan}\n\n` +
      `💪 _${a.motivation}_`;

    for (const tgId of ALLOWED_TG_IDS) {
      for (const part of splitMessage(message)) {
        await safeSend(tgId, part);
        await new Promise(r => setTimeout(r, 400));
      }
    }

    // Streak обновляем в БД (видно на сайте тоже через strict:false)
    if ((a.score || 0) >= 6) {
      log.streak = (log.streak || 0) + 1;
      await log.save();
      if (log.streak > 1) {
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(tgId, `🔥 *Стрик: ${log.streak} кун!* Давом эт!`);
        }
      }
    }

  } catch (err) {
    console.error("Night analysis error:", err.message);
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 9. CRON: ЯДЕРНЫЙ ПРОТОКОЛ (каждые 30 мин)
// Читает penaltyDebt из DayLog (как сайт записывает через /api/journal)
// ==========================================
cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    // Ищем по userId=masterEmail, как делает сайт
    const debtors = await DayLog.find({
      penaltyDebt: { $gt: 0 },
      debtCreatedAt: { $ne: null },
      nukeTriggered: false
    });

    for (const log of debtors) {
      const hoursPassed = (now - new Date(log.debtCreatedAt)) / 3600000;
      // Найти Telegram ID для этого masterEmail
      const tgIds = Object.entries(CONFIG.userMap)
        .filter(([, email]) => email === log.userId)
        .map(([tgId]) => tgId);

      if (hoursPassed >= 24) {
        if (userbot && CONFIG.nukeContacts.length > 0) {
          const nukeMsg = `Ассалому алайкум. Мен бугун ўз иродамни енга олмадим. Максадларимни (Немецкий/Намоз) қолдирганим учун ўзимга ${log.penaltyDebt} сомони эҳсон қилишни жарима қилиб белгилаган эдим. Лекин нафсим балосига гирифтор бўлиб, шу садақани ҳам 24 соат ичида қилмадим.\n\nИлтимос, менга қўнғироқ қилинг ва нега бундай қилганимни қаттиқ сўроқ қилинг. Менга сизнинг назоратингиз керак.`;
          for (const contact of CONFIG.nukeContacts) {
            try { await userbot.sendMessage(contact, { message: nukeMsg }); } catch (e) { console.error("Nuke:", e.message); }
          }
          for (const tgId of tgIds) await safeSend(tgId, `☢️ *ЯДЕРНИЙ ЗАРБА БЕРИЛДИ!*\nЯқинларингга хабар юборилди.`);
        } else {
          for (const tgId of tgIds) await safeSend(tgId, `⚠️ Юзербот йўқ. Қарз ${log.penaltyDebt} сом қолди!`);
        }
        log.nukeTriggered = true;
        await log.save();

      } else if (hoursPassed >= 20 && !log.warning20hSent) {
        const left = Math.floor(24 - hoursPassed);
        for (const tgId of tgIds) {
          await safeSend(tgId, `🚨 *СЎНГГИ ОГОҲЛАНТИРИШ!*\n\n⏳ Қолди: *${left} соат*\n💰 Қарз: *${log.penaltyDebt} сомони*\n\nАгар тўламасанг — яқинларинг хабардор қилинади!`);
        }
        log.warning20hSent = true;
        await log.save();

      } else if (hoursPassed >= 12 && !log.warning12hSent) {
        const left = Math.floor(24 - hoursPassed);
        for (const tgId of tgIds) {
          await safeSend(tgId, `⚠️ *Эслатма!* Қарз: ${log.penaltyDebt} сом. Қолди: ${left} соат.`);
        }
        log.warning12hSent = true;
        await log.save();
      }
    }
  } catch (err) {
    console.error("Nuke cron error:", err.message);
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 10. ОБРАБОТКА СООБЩЕНИЙ
// ==========================================
const MENU_CMDS = ['📊','📝','🤲','💀','💰','🧠','🏆','❓'];

bot.on('message', async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  if (!msg.text || msg.text.startsWith('/')) return;
  if (MENU_CMDS.some(cmd => msg.text.startsWith(cmd))) return;

  const masterEmail = getMasterEmail(tgId);
  const log = await getOrCreateLog(masterEmail);

  // Почасовой ответ
  if (log.questionPending && log.currentQuestionHour != null) {
    const already = log.hourlyResponses.some(r => r.hour === log.currentQuestionHour);
    if (already) {
      await safeSend(tgId, '✅ Бу соат учун жавоб аллақачон сақланган.');
      return;
    }

    const time = `${String(log.currentQuestionHour).padStart(2,'0')}:00`;
    let aiReaction = '';
    try {
      const p = `Медицина студенти (нейрохирургия мақсади). Соат ${time} да ёзди: "${msg.text.trim()}". 1-2 жумла: мотивация ёки огоҳлантириш. Ўзбек кирилл.`;
      aiReaction = await callGemini(p);
    } catch { aiReaction = ''; }

    log.hourlyResponses.push({
      time,
      hour: log.currentQuestionHour,
      text: msg.text.trim(),
      aiReaction,
      savedAt: new Date()
    });
    log.questionPending = false;
    log.currentQuestionHour = null;
    await log.save();

    await safeSend(tgId, aiReaction
      ? `✅ *Жавоб сақланди*\n\n🤖 ${aiReaction}`
      : `✅ Жавобингиз сақланди _(${time})_`
    );
    return;
  }

  // Свободный чат
  const loading = await bot.sendMessage(tgId, '🧠 Ўйламоқда...');
  try {
    const reply = await callGemini(
      `Сен Жавоҳирнинг AI-коучисан. У 4-курс тиббиёт студенти, нейрохирург бўлишни мақсад қилган (Германия).\nУ ёзди: "${msg.text}"\nЎзбек кирилл, 3-4 жумла, аниқ ва лўнда.`
    );
    await bot.editMessageText(`🤖 ${reply}`, {
      chat_id: msg.chat.id, message_id: loading.message_id, parse_mode: 'Markdown'
    });
  } catch {
    await bot.editMessageText('⚠️ AI жавоб беришда хато.', { chat_id: msg.chat.id, message_id: loading.message_id });
  }
});

// ==========================================
// 11. ГОЛОСОВЫЕ СООБЩЕНИЯ
// ==========================================
bot.on('voice', async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;

  const loading = await bot.sendMessage(tgId, '🎙️ Овоз таҳлил қилинмоқда...');
  try {
    const fileLink = await bot.getFileLink(msg.voice.file_id);
    const { data } = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const base64Audio = Buffer.from(data).toString('base64');

    const result = await aiModel.generateContent([
      `Сен Жавоҳирнинг қаттиққўл лекин меҳрибон AI-акасисан. У нейрохирург бўлишни мақсад қилган.\nДангасалик бўлса — қаттиқ айт. Чарчаса — мотивация бер. Савол бўлса — аниқ жавоб. Ўзбек Кирилл, қисқа.`,
      { inlineData: { mimeType: 'audio/ogg', data: base64Audio } }
    ]);
    await bot.editMessageText(
      `🎙️ *AI жавоби:*\n\n${result.response.text()}`,
      { chat_id: msg.chat.id, message_id: loading.message_id, parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.editMessageText('⚠️ Овозни таниб бўлмади.', { chat_id: msg.chat.id, message_id: loading.message_id });
  }
});

// ==========================================
// 12. КОМАНДЫ
// ==========================================
bot.onText(/\/start/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return safeSend(tgId, '⛔ Кечирасиз, бу шахсий бот.');
  const name = msg.from.first_name || 'Доктор';
  await safeSend(tgId,
    `🏥 *Medical Brother v6.0*\n\nХуш келибсиз, *${name}!* 👋\n\n` +
    `✅ Сайт билан тўлиқ синхрон (MongoDB)\n` +
    `✅ Ҳар соат 06:00–22:00 текшираман\n` +
    `✅ Кеча 22:05 да AI таҳлил + JSON статистика\n` +
    `✅ Срыв сайтда ҳам кўринади\n` +
    `✅ Ядерний протокол: 12ч → 20ч → 24ч\n\n` +
    `_Нейрохирургия йўли узоқ, бирга борамиз!_ 💪`,
    mainKeyboard
  );
});

// Статус — данные из той же коллекции что и сайт
bot.onText(/📊 Статус/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const masterEmail = getMasterEmail(tgId);
  const log = await getOrCreateLog(masterEmail);
  const hour = getTashkentHour();
  const expected = Math.max(0, hour - 5);
  const answered = (log.hourlyResponses || []).length;
  const rate = expected > 0 ? Math.round((answered / expected) * 100) : 0;

  let debtInfo = '';
  if ((log.penaltyDebt || 0) > 0 && log.debtCreatedAt) {
    const passed = ((new Date() - new Date(log.debtCreatedAt)) / 3600000).toFixed(1);
    const left = Math.max(0, 24 - passed).toFixed(1);
    debtInfo = `\n⏳ Таймер: ${passed}ч / қолди: *${left} соат*`;
  }

  await safeSend(tgId,
    `📅 *${getToday()}* — ${DAY_NAMES[getTashkentDate().getDay()]}\n\n` +
    `📈 *Балл (сайт):* ${log.score || 0}%\n` +
    `🔁 Anki: ${log.academic?.ankiDone || 0} карта\n` +
    `🤲 Намоз: ${log.spiritual?.prayersDone || 0}/5\n` +
    `🌙 Тоҳажжуд: ${log.spiritual?.tahajjud ? '✅' : '❌'}\n` +
    `📖 Қуръон: ${log.spiritual?.quranPages || 0} бет\n` +
    `🏃 Спорт: ${log.sport?.didSport ? '✅' : '❌'}\n\n` +
    `💬 Жавоблар: ${answered}/${expected} (${rate}%)\n` +
    `💰 Қарз: *${log.penaltyDebt || 0} сом*${debtInfo}`
  );
});

// История ответов + AI реакции
bot.onText(/📝 Жавоблар/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const log = await getOrCreateLog(getMasterEmail(tgId));
  const responses = log.hourlyResponses || [];
  if (!responses.length) return safeSend(tgId, '📝 Бугун ҳали жавоб берилмади.');

  const list = responses
    .sort((a, b) => a.hour - b.hour)
    .map(r => `⏰ *${r.time}*\n└ ${r.text}${r.aiReaction ? `\n└ 🤖 _${r.aiReaction}_` : ''}`)
    .join('\n\n');

  for (const part of splitMessage(`📝 *Бугунги жавоблар (${responses.length} та):*\n\n${list}`)) {
    await safeSend(tgId, part);
    await new Promise(r => setTimeout(r, 300));
  }
});

// Намоз +1 — пишет в ту же коллекцию что и сайт
bot.onText(/🤲 Намоз \+1/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const log = await getOrCreateLog(getMasterEmail(tgId));
  const current = log.spiritual?.prayersDone || 0;
  if (current >= 5) return safeSend(tgId, '✅ *Барча 5 вақт намоз ўқилган!* Маш Аллоҳ! 🤲');

  log.spiritual.prayersDone = current + 1;
  await log.save();

  const reactions = ['','Бисмиллаҳ! 1/5 🕌','2/5 — давом эт!','3/5 — ярмидан ошди! 💪','4/5 — яна битта!','🌟 *5/5 — Маш Аллоҳ!* Барака топинг! 🤲'];
  await safeSend(tgId, `🤲 *Намоз ${current + 1}/5* ✅\n${reactions[current + 1]}`);
});

// Срыв — пишет в DayLog И UserProfile (как сайт через /api/journal)
bot.onText(/💀 Срыв/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const masterEmail = getMasterEmail(tgId);
  const log = await getOrCreateLog(masterEmail);

  if (!log.debtCreatedAt || (log.penaltyDebt || 0) === 0) {
    log.debtCreatedAt = new Date();
    log.warning12hSent = false;
    log.warning20hSent = false;
    log.nukeTriggered = false;
  }

  log.penaltyDebt = (log.penaltyDebt || 0) + 50;
  await log.save();

  // Синхронизируем с UserProfile (сайт читает отсюда)
  await syncDebtToProfile(masterEmail, log.penaltyDebt, log.debtCreatedAt);

  await safeSend(tgId,
    `💀 *СРЫВ ҚАЙД ЭТИЛДИ!*\n\n` +
    `⚠️ Жарима: +50 сомони\n` +
    `💰 Жами қарз: *${log.penaltyDebt} сомони*\n` +
    `⏳ 24 соатлик таймер ишга тушди!\n\n` +
    `_Сайтда ҳам кўриниш бор. Агар тўламасанг — ядерний протокол!_ ☢️`
  );
});

// Долг
bot.onText(/💰 Қарз/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const log = await getOrCreateLog(getMasterEmail(tgId));
  const debt = log.penaltyDebt || 0;
  if (!debt) return safeSend(tgId, '✅ *Қарз йўқ!* Давом эт, доктор! 💪');

  const passed = log.debtCreatedAt ? ((new Date() - new Date(log.debtCreatedAt)) / 3600000).toFixed(1) : '?';
  const left = parseFloat(passed) ? Math.max(0, 24 - parseFloat(passed)).toFixed(1) : '?';
  const urgency = parseFloat(left) < 4 ? '\n🚨 *ВАҚТ АЗ ҚОЛДИ! ШОШИЛИНГ!*' : parseFloat(left) < 8 ? '\n⚠️ Вақт тугаяпти!' : '';

  await safeSend(tgId,
    `💰 *Қарз ҳолати:*\n\nМиқдор: *${debt} сомони*\nЎтди: ${passed} соат\nҚолди: ⏳ *${left} соат*${urgency}`
  );
});

// AI анализ вручную
bot.onText(/🧠 AI Таҳлил/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const log = await getOrCreateLog(getMasterEmail(tgId));
  const responses = log.hourlyResponses || [];
  if (responses.length < 2) return safeSend(tgId, '📝 Таҳлил учун камида *2 та* жавоб керак.');

  const loading = await bot.sendMessage(tgId, '🧠 AI таҳлил қилмоқда...');
  try {
    const list = responses.sort((a,b)=>a.hour-b.hour).map(r=>`• ${r.time} — "${r.text}"`).join('\n');
    const analysis = await callGemini(
      `Медицина студентининг бугунги жавоблари:\n${list}\nАнки: ${log.academic?.ankiDone||0}, Намоз: ${log.spiritual?.prayersDone||0}/5\nЎзбек кирилл, 5-7 жумла: нима яхши, нима ёмон, эртага нима қилсин.`
    );
    await bot.editMessageText(`🧠 *AI Таҳлил:*\n\n${analysis}`, {
      chat_id: msg.chat.id, message_id: loading.message_id, parse_mode: 'Markdown'
    });
  } catch {
    await bot.editMessageText('⚠️ AI хато.', { chat_id: msg.chat.id, message_id: loading.message_id });
  }
});

// Streak
bot.onText(/🏆 Стрик/, async (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  const log = await getOrCreateLog(getMasterEmail(tgId));
  const streak = log.streak || 0;
  const emoji = streak >= 14 ? '🏆' : streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🌱';
  await safeSend(tgId,
    `${emoji} *Стрик: ${streak} кун*\n\n${
      streak === 0 ? 'Ҳали бошланмади. Бугун яхши кун ўтказ!' :
      streak < 3   ? 'Яхши бошланиш! Давом эт.' :
      streak < 7   ? 'Яхши! Бир ҳафтага боряпсан!' :
      streak < 14  ? '🔥 Уставорсан! Икки ҳафтага борди!' :
                     '🏆 Чемпион! Тўхтама!'
    }`
  );
});

// Помощь
bot.onText(/❓ Ёрдам/, (msg) => {
  const tgId = msg.from.id.toString();
  if (!isAllowed(tgId)) return;
  safeSend(tgId,
    `📖 *БУЙРУҚЛАР:*\n\n` +
    `📊 Статус — кун натижалари (сайт билан синхрон)\n` +
    `📝 Жавоблар — соатлик жавоблар + AI реакция\n` +
    `🤲 Намоз +1 — намоз ҳисоблаш (сайтда ҳам кўринади)\n` +
    `💀 Срыв — жарима +50 сом (сайтда ҳам!)\n` +
    `💰 Қарз — қарз ва таймер ҳолати\n` +
    `🧠 AI Таҳлил — ҳозир таҳлил\n` +
    `🏆 Стрик — кетма-кет яхши кунлар\n\n` +
    `🎙️ *Овозли хабар* — AI жавоб беради\n` +
    `💬 *Исталган матн* — AI коуч жавоб беради\n\n` +
    `⏰ Соатлик савол: 06:00–22:00 _(исправленный cron!)_\n` +
    `🌙 AI таҳлил: 22:05 автоматик`
  );
});

// ==========================================
// 13. POLLING + HTTP
// ==========================================
bot.on('polling_error', (err) => {
  if (err.code !== 'EFATAL') console.error('Polling error:', err.code);
});

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok', version: '6.0',
    uptime: process.uptime().toFixed(0) + 's',
    users: ALLOWED_TG_IDS.length
  }));
}).listen(process.env.PORT || 3000, () => {
  console.log(`🌐 HTTP: порт ${process.env.PORT || 3000}`);
});
