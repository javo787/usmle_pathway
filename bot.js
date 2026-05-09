require('dotenv').config({ path: '.env.local' });
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const connectDB = require('./db/connection');
const { CONFIG, ALLOWED_TG_IDS } = require('./config');
const { initUserbot } = require('./userbot/nukeSender');
const createGemini = require('./ai/gemini');
const scheduleHourlyQuestions = require('./cron/hourlyQuestions');
const scheduleMorningGreeting = require('./cron/morningGreeting');
const schedulePlanDeadline = require('./cron/planDeadline');
const scheduleNightAnalysis = require('./cron/nightAnalysis');
const scheduleNukeProtocol = require('./cron/nukeProtocol');
const schedulePrayerTimes = require('./cron/prayerTimes');
const scheduleWeeklyReport = require('./cron/weeklyReport');
const scheduleAntiRelapse = require('./cron/antiRelapse');
const scheduleWakeUpPoll = require('./cron/wakeUpPoll');
const setupMessageHandler = require('./handlers/messageHandler');
const setupVoiceHandler = require('./handlers/voiceHandler');
const setupCallbackHandler = require('./handlers/callbackHandler');
const registerCommands = require('./handlers/commands');

// Валидация конфигурации
if (!CONFIG.botToken || !CONFIG.mongoUri || !ALLOWED_TG_IDS.length) {
  console.error("❌ ХАТО: TELEGRAM_BOT_TOKEN, MONGODB_URI ёки TELEGRAM_USER_ID йўқ!");
  process.exit(1);
}

(async () => {
  // 1. База данных
  await connectDB(CONFIG.mongoUri);

  // 2. Gemini AI
  const { callGemini, model } = createGemini(CONFIG.geminiKey);

  // 3. Основной бот
  const bot = new TelegramBot(CONFIG.botToken, { polling: true });
  console.log(`🤖 Medical Brother v6.0 — полный функционал`);

  // 4. Юзербот (если настроен)
  const userbot = await initUserbot(CONFIG.apiId, CONFIG.apiHash, CONFIG.userbotSession);

  // 5. Все Cron-задачи
  scheduleHourlyQuestions(bot);        // почасовые контекстные вопросы
  scheduleMorningGreeting(bot);       // динамическое приветствие (wakeUpTime)
  schedulePlanDeadline(bot);          // контроль планов 9:00/9:30
  scheduleNightAnalysis(bot, callGemini); // AI-анализ + streak-награды
  scheduleNukeProtocol(bot, userbot); // ядерный таймер
  schedulePrayerTimes(bot);           // намоз таймер с кнопками
  scheduleWeeklyReport(bot, callGemini); // отчёт каждое воскресенье
  scheduleAntiRelapse(bot);           // антирелапс в 22:00 и 00:00
  scheduleWakeUpPoll(bot);            // опрос времени пробуждения по воскресеньям

  // 6. Обработчики сообщений
  setupMessageHandler(bot, { callGemini });
  setupVoiceHandler(bot, { model });
  setupCallbackHandler(bot);          // обработка всех inline-кнопок
  registerCommands(bot, { callGemini });

  // 7. HTTP для мониторинга
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '6.0-full',
      uptime: process.uptime().toFixed(0) + 's',
      users: ALLOWED_TG_IDS.length
    }));
  }).listen(process.env.PORT || 3000, () => {
    console.log(`🌐 HTTP health-check на порту ${process.env.PORT || 3000}`);
  });

  // Ошибки polling
  bot.on('polling_error', (err) => {
    if (err.code !== 'EFATAL') console.error('Polling error:', err.code);
  });

  console.log('🚀 Бот полностью готов к работе');
})();
