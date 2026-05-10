require('dotenv').config();
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

  // 4. Юзербот (если настроен) — НЕ роняет бота если сломан
  let userbot = null;
  try {
    userbot = await initUserbot(CONFIG.apiId, CONFIG.apiHash, CONFIG.userbotSession);
  } catch (e) {
    console.warn("⚠️ Юзербот старта бермади (ядерный протокол ўчирилди):", e.message);
  }

  // 5. Все Cron-задачи
  scheduleHourlyQuestions(bot);
  scheduleMorningGreeting(bot);
  schedulePlanDeadline(bot);
  scheduleNightAnalysis(bot, callGemini);
  scheduleNukeProtocol(bot, userbot);
  schedulePrayerTimes(bot);
  scheduleWeeklyReport(bot, callGemini);
  scheduleAntiRelapse(bot);
  scheduleWakeUpPoll(bot);

  // 6. Обработчики сообщений
  setupMessageHandler(bot, { callGemini });
  setupVoiceHandler(bot, { model });
  setupCallbackHandler(bot);
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

  // Ошибки polling — не роняем процесс
  bot.on('polling_error', (err) => {
    if (err.code !== 'EFATAL') console.error('Polling error:', err.code, err.message);
  });

  // Непойманные ошибки — логируем, не падаем
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });

  console.log('🚀 Бот полностью готов к работе');
})();
