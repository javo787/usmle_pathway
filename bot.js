require('dotenv').config({ path: '.env.local' });
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

// ==========================================
// 1. КОНФИГУРАЦИЯ
// ==========================================
const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  mongoUri: process.env.MONGODB_URI,
  geminiKey: process.env.GEMINI_API_KEY,
  // Разрешённые Telegram ID (строками)
  allowedUsers: [
    process.env.TELEGRAM_USER_ID,           // основной владелец
    '8383611951'                            // второй пользователь
  ].filter(Boolean),
  // Данные юзербота (только для основного владельца)
  apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
  apiHash: process.env.TELEGRAM_API_HASH,
  userbotSession: process.env.USERBOT_SESSION,
  nukeContacts: (process.env.NUKE_CONTACTS || '').split(',').filter(Boolean),
  // Часовой пояс
  timezone: 'Asia/Tashkent',
};

// Проверка критических переменных
if (!CONFIG.botToken || !CONFIG.mongoUri || !CONFIG.allowedUsers.length) {
  console.error('❌ Ошибка: отсутствуют TELEGRAM_BOT_TOKEN, MONGODB_URI или TELEGRAM_USER_ID');
  process.exit(1);
}

// ==========================================
// 2. БАЗА ДАННЫХ
// ==========================================
mongoose.connect(CONFIG.mongoUri)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err.message));

// Схема одного дня (для каждого пользователя)
const DayLogSchema = new mongoose.Schema({
  userId: String,             // Telegram ID пользователя
  date: String,               // YYYY-MM-DD
  academic: Object,           // учёба
  spiritual: Object,          // духовное
  sport: Object,              // спорт
  penaltyDebt: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  prayers: { type: Number, default: 0 }, // намазы

  // Ежечасные ответы
  hourlyAnswers: [{
    hour: Number,             // час (0-23)
    answer: String,
    timestamp: Date
  }],
  questionPending: { type: Boolean, default: false },    // ожидается ли ответ на текущий вопрос
  currentQuestionHour: { type: Number, default: null },

  // Ядерный протокол (только для основного пользователя, но схема едина)
  debtCreatedAt: { type: Date, default: null },
  warning20hSent: { type: Boolean, default: false },
  nukeTriggered: { type: Boolean, default: false }
}, { strict: false });

const DayLog = mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ БОТОВ И AI
// ==========================================
const bot = new TelegramBot(CONFIG.botToken, { polling: true });
const genAI = new GoogleGenerativeAI(CONFIG.geminiKey);
const aiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
});

// Юзербот (только если заданы все параметры)
let userbot;
(async () => {
  if (CONFIG.apiId && CONFIG.apiHash && CONFIG.userbotSession) {
    const stringSession = new StringSession(CONFIG.userbotSession);
    userbot = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, { connectionRetries: 5 });
    await userbot.connect();
    console.log('☢️ Юзербот (Ядерный протокол) активирован');
  } else {
    console.log('⚠️ Юзербот не настроен — ядерная эскалация отключена');
  }
})();

// Главный Telegram ID (первый в списке)
const MAIN_USER = CONFIG.allowedUsers[0];

// ==========================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================
const isAllowed = (userId) => CONFIG.allowedUsers.includes(userId.toString());

const getTodayLog = async (userId) => {
  const date = new Date().toISOString().split('T')[0];
  let log = await DayLog.findOne({ userId, date });
  if (!log) {
    log = new DayLog({ userId, date });
    await log.save();
  }
  return log;
};

// Безопасная отправка сообщения (ловим ошибки, если юзер заблокировал бота)
const safeSend = async (chatId, text, options = {}) => {
  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (e) {
    console.warn(`⚠️ Не удалось отправить сообщение пользователю ${chatId}: ${e.message}`);
    return null;
  }
};

// ==========================================
// 5. ЕЖЕЧАСНЫЕ ВОПРОСЫ (06:00–22:00)
// ==========================================
cron.schedule('0 6-22 * * *', async () => {
  const now = new Date();
  const hour = now.getHours();
  console.log(`⏰ Час ${hour}: рассылаю вопрос продуктивности`);

  for (const userId of CONFIG.allowedUsers) {
    try {
      const log = await getTodayLog(userId);
      // Сохраняем флаг ожидания
      log.questionPending = true;
      log.currentQuestionHour = hour;
      await log.save();

      // Отправляем вопрос
      await safeSend(userId, `🤔 *Нима қилавоосиз? Максад томон кетавоссизми?*`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`Ошибка при обработке пользователя ${userId} в часе ${hour}:`, err);
    }
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 6. ОБРАБОТКА ОТВЕТОВ НА ВОПРОСЫ
// ==========================================
// Любое текстовое сообщение от разрешённого пользователя (кроме команд)
// расценивается как ответ на последний заданный вопрос, если флаг questionPending активен.
bot.on('message', async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;

  // Пропускаем команды и служебные сообщения
  if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('📊') || msg.text.startsWith('🤲') ||
      msg.text.startsWith('💀') || msg.text.startsWith('💰')) return;

  try {
    const log = await DayLog.findOne({ userId, date: new Date().toISOString().split('T')[0] });
    if (!log || !log.questionPending) return; // не ожидается ответ

    const hour = log.currentQuestionHour || new Date().getHours();
    log.hourlyAnswers.push({
      hour,
      answer: msg.text.trim(),
      timestamp: new Date()
    });
    log.questionPending = false;
    log.currentQuestionHour = null;
    await log.save();

    // Краткое подтверждение (чтобы не раздражать)
    await safeSend(userId, '✅ Жавоб сақланди.');
  } catch (err) {
    console.error('Ошибка сохранения ответа:', err);
  }
});

// ==========================================
// 7. ВЕЧЕРНИЙ ИИ‑АНАЛИЗ ОТВЕТОВ (22:30)
// ==========================================
cron.schedule('30 22 * * *', async () => {
  console.log('🌙 Запуск вечернего анализа');
  const date = new Date().toISOString().split('T')[0];

  for (const userId of CONFIG.allowedUsers) {
    try {
      const log = await DayLog.findOne({ userId, date });
      if (!log || log.hourlyAnswers.length === 0) {
        await safeSend(userId, '😔 Бугун бирорта ҳам жавоб бермадингиз. Ўзингизни қўлга олинг!');
        continue;
      }

      // Формируем текст для AI
      const answersList = log.hourlyAnswers
        .sort((a, b) => a.hour - b.hour)
        .map(entry => `- ${entry.hour}:00 – ${entry.answer}`)
        .join('\n');

      const prompt = `Сен қатъий, лекин меҳрибон менторсан. Фойдаланувчи бугун ҳар соатда ўз ҳолати ҳақида жавоб берди. Мақсад: тиббий таълим (USMLE) ва шахсий ривожланиш. Жавоблар:\n${answersList}\n\nТаҳлил қил: у нима билан машғул бўлган? Қанчалик мақсад сари илгарилаган? Дангасалик, чалғишлар борми? Кучли томонлари ва заифликларини аниқла. Эртанга учун аниқ, қисқа ва курашувчан маслаҳат бер (иложи бўлса, жазо ёки рағбатлантириш таклиф қил). 200 сўздан ошмасин, ўзбек тилида (кирилл).`;

      const result = await aiModel.generateContent(prompt);
      const text = result.response.text();

      await safeSend(userId, `📊 *Бугунги кун таҳлили:*\n\n${text}`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`Ошибка вечернего анализа для ${userId}:`, err);
    }
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 8. ЯДЕРНЫЙ ПРОТОКОЛ (только для MAIN_USER)
// ==========================================
cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    const debtors = await DayLog.find({
      userId: MAIN_USER,
      penaltyDebt: { $gt: 0 },
      debtCreatedAt: { $ne: null },
      nukeTriggered: false
    });

    for (let log of debtors) {
      const hoursPassed = (now - new Date(log.debtCreatedAt)) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        if (userbot && CONFIG.nukeContacts.length > 0) {
          const message = `Ассалому алайкум. Мен бугун ўз иродамни енга олмадим. Максадларимни (USMLE/Намоз) қолдирганим учун ўзимга ${log.penaltyDebt} сомони эҳсон қилишни жарима қилиб белгилаган эдим. Лекин нафсим балосига гирифтор бўлиб, шу садақани ҳам 24 соат ичида қилмадим.\n\nИлтимос, шу хатни ўқигач, менга қўнғироқ қилинг ва нега бундай қилганимни қаттиқ сўроқ қилинг. Менга сизнинг назоратингиз керак.`;
          for (let phone of CONFIG.nukeContacts) {
            await userbot.sendMessage(phone, { message });
          }
          await safeSend(MAIN_USER, '☢️ *ЯДЕРНЫЙ УДАР!*\nТвоим контактам отправлено признание. Исправляйся.');
        } else {
          await safeSend(MAIN_USER, '⚠️ Взрыв отменён (юзербот не активен), но ты всё равно проиграл. Действуй.');
        }
        log.nukeTriggered = true;
        await log.save();
      } else if (hoursPassed >= 20 && !log.warning20hSent) {
        const timeLeft = Math.floor(24 - hoursPassed);
        await safeSend(MAIN_USER,
          `🚨 *СЎНГГИ ОГОҲЛАНТИРИШ!*\n\nЭҳсон қилишга ${timeLeft} соат қолди. Қарз: ${log.penaltyDebt} сомони.\nАгар тўламасанг – яқинларинг хабардор қилинади!`,
          { parse_mode: 'Markdown' }
        );
        log.warning20hSent = true;
        await log.save();
      }
    }
  } catch (err) {
    console.error('Cron Escalation Error:', err);
  }
});

// ==========================================
// 9. ОБРАБОТКА ГОЛОСОВЫХ СООБЩЕНИЙ (AI)
// ==========================================
bot.on('voice', async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;

  const loadingMsg = await bot.sendMessage(msg.chat.id, '🧠 Анализ голоса...');
  try {
    const fileLink = await bot.getFileLink(msg.voice.file_id);
    const { data } = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const base64Audio = Buffer.from(data).toString('base64');

    const prompt = `Сен қаттиққўл, лекин меҳрибон акасан. Фойдаланувчи тиббиёт талабаси. Унинг овозли жавобини тинглаб, ҳолатини баҳола: энергия, мотивация, дангасалик. Қисқа ва лўнда жавоб бер (ўзбек кирилл).`;

    const result = await aiModel.generateContent([
      prompt,
      { inlineData: { mimeType: 'audio/ogg', data: base64Audio } }
    ]);
    await bot.editMessageText(`🤖 *Ака:* ${result.response.text()}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    bot.editMessageText('⚠️ Овозни таниб бўлмади ёки сервер банд.', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// ==========================================
// 10. КОМАНДЫ БОТА
// ==========================================
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['📊 Статус', '🤲 Намоз +1'],
      ['💀 Срыв (Нафс)', '💰 Қарз текшириш']
    ],
    resize_keyboard: true
  }
};

bot.onText(/\/start/, (msg) => {
  if (!isAllowed(msg.from.id.toString())) return;
  safeSend(msg.chat.id, '🤖 Medical Brother v3.0 Hardcore готов.\nКомандуйте, Доктор.', mainKeyboard);
});

// Статус
bot.onText(/📊 Статус/, async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;
  try {
    const log = await getTodayLog(userId);
    const text = `📅 *${log.date}*\n📈 Балл: ${log.score || 0}%\n🤲 Намоз: ${log.prayers || 0}\n💰 Қарз: ${log.penaltyDebt || 0} с.`;
    safeSend(msg.chat.id, text, { parse_mode: 'Markdown' });
  } catch (e) {
    safeSend(msg.chat.id, '⚠️ Ошибка при получении статуса.');
  }
});

// Намоз +1
bot.onText(/🤲 Намоз \+1/, async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;
  try {
    const log = await getTodayLog(userId);
    log.prayers = (log.prayers || 0) + 1;
    await log.save();
    safeSend(msg.chat.id, `✅ Намозлар сони: ${log.prayers}. Барака топинг!`);
  } catch (e) {
    safeSend(msg.chat.id, '⚠️ Хатолик юз берди.');
  }
});

// Срыв — назначение штрафа с таймером (только для MAIN_USER)
bot.onText(/💀 Срыв/, async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;
  if (userId !== MAIN_USER) {
    safeSend(msg.chat.id, '⛔ Бу функция фақат асосий фойдаланувчи учун.');
    return;
  }
  try {
    const log = await getTodayLog(userId);
    if (!log.penaltyDebt || log.penaltyDebt === 0) {
      log.debtCreatedAt = new Date();
      log.warning20hSent = false;
      log.nukeTriggered = false;
    }
    log.penaltyDebt = (log.penaltyDebt || 0) + 50;
    await log.save();
    safeSend(msg.chat.id, `⚠️ *СРЫВ!* Жарима +50 сомони.\n⏳ 24 соатлик таймер ишга тушди!`, { parse_mode: 'Markdown' });
  } catch (e) {
    safeSend(msg.chat.id, '⚠️ Хатолик.');
  }
});

// Қарз текшириш
bot.onText(/💰 Қарз текшириш/, async (msg) => {
  const userId = msg.from.id.toString();
  if (!isAllowed(userId)) return;
  try {
    const log = await getTodayLog(userId);
    safeSend(msg.chat.id, `💰 Жорий қарз: ${log.penaltyDebt || 0} сомони.`);
  } catch (e) {
    safeSend(msg.chat.id, '⚠️ Хатолик.');
  }
});

// ==========================================
// 11. УТРЕННЕЕ И ВЕЧЕРНЕЕ НАПОМИНАНИЯ
// ==========================================
cron.schedule('0 6 * * *', async () => {
  for (const userId of CONFIG.allowedUsers) {
    await safeSend(userId, '🌅 *Ассаламу алайкум!*\n\nСоат 06:00. Нейрохирургия кутмайди. Иловага кириб, бугунги кун режасини тузинг!', { parse_mode: 'Markdown' });
  }
}, { timezone: CONFIG.timezone });

cron.schedule('0 22 * * *', async () => {
  const date = new Date().toISOString().split('T')[0];
  for (const userId of CONFIG.allowedUsers) {
    const log = await DayLog.findOne({ userId, date });
    if (!log || (log.score || 0) < 50) {
      await safeSend(userId, '😡 *Эслатма!*\nСоат 22:00, натижа паст. Иловага кириб, эртанги кунни режалаштир ёки қарздор бўласан!', { parse_mode: 'Markdown' });
    }
  }
}, { timezone: CONFIG.timezone });

// ==========================================
// 12. HTTP СЕРВЕР ДЛЯ RENDER
// ==========================================
require('http').createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(process.env.PORT || 3000);

console.log('🤖 Medical Brother v3.0 Hardcore успешно запущен');
