require('dotenv').config({ path: '.env.local' });
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

// ==========================================
// 1. КОНФИГУРАЦИЯ И ПРОВЕРКА ОКРУЖЕНИЯ
// ==========================================
const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  adminId: process.env.TELEGRAM_USER_ID,
  mongoUri: process.env.MONGODB_URI,
  geminiKey: process.env.GEMINI_API_KEY,
  apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
  apiHash: process.env.TELEGRAM_API_HASH,
  userbotSession: process.env.USERBOT_SESSION,
  nukeContacts: (process.env.NUKE_CONTACTS || "").split(',').filter(Boolean)
};

if (!CONFIG.botToken || !CONFIG.mongoUri || !CONFIG.adminId) {
  console.error("❌ ХАТО: .env.local файлида асосий калитлар йўқ!");
  process.exit(1);
}

// ==========================================
// 2. БАЗА ДАННЫХ (MONGODB)
// ==========================================
mongoose.connect(CONFIG.mongoUri)
  .then(() => console.log("✅ MongoDB уланди"))
  .catch(err => console.error("❌ MongoDB Хатоси:", err.message));

// Обновленная схема под архитектуру NextAuth и Ядерный протокол
const DayLogSchema = new mongoose.Schema({
  userId: String, // Идентификатор пользователя (email)
  date: String,
  academic: Object,
  spiritual: Object,
  sport: Object,
  penaltyDebt: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  
  // --- ЯДЕРНЫЙ ПРОТОКОЛ ---
  debtCreatedAt: { type: Date, default: null }, // Время получения штрафа
  warning20hSent: { type: Boolean, default: false }, // Отправлено ли предупреждение
  nukeTriggered: { type: Boolean, default: false } // Взорвалась ли бомба
}, { strict: false });

const DayLog = mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ БОТОВ И AI
// ==========================================
const bot = new TelegramBot(CONFIG.botToken, { polling: true });
const genAI = new GoogleGenerativeAI(CONFIG.geminiKey);
const aiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
});

// Настройка Юзербота (Работает от твоего имени)
let userbot;
(async () => {
  if (CONFIG.apiId && CONFIG.apiHash && CONFIG.userbotSession) {
    const stringSession = new StringSession(CONFIG.userbotSession);
    userbot = new TelegramClient(stringSession, CONFIG.apiId, CONFIG.apiHash, { connectionRetries: 5 });
    await userbot.connect();
    console.log("☢️ Юзербот (Ядерний протокол) жанговар шай ҳолатда!");
  } else {
    console.log("⚠️ Юзербот созланмаган. Ядерний протокол ишламайди (USERBOT_SESSION йўқ).");
  }
})();

const MASTER_EMAIL = 'javo.nur.2004@gmail.com';

console.log(`🤖 "Medical Brother" (v3.0 - Hardcore) ишга тушди...`);

// ==========================================
// 4. ЯДЕРНЫЙ ПРОТОКОЛ (СИСТЕМА ЭСКАЛАЦИИ)
// ==========================================
// Проверяем долги каждые 30 минут
cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    // Ищем должников, у которых бомба еще не взорвалась
    const debtors = await DayLog.find({ 
      penaltyDebt: { $gt: 0 }, 
      debtCreatedAt: { $ne: null },
      nukeTriggered: false
    });

    for (let log of debtors) {
      const hoursPassed = (now - new Date(log.debtCreatedAt)) / (1000 * 60 * 60);

      // СТАДИЯ 3: ЯДЕРНЫЙ ВЗРЫВ (> 24 часов)
      if (hoursPassed >= 24) {
        if (userbot && CONFIG.nukeContacts.length > 0) {
          const message = `Ассалому алайкум. Мен бугун ўз иродамни енга олмадим. Максадларимни (USMLE/Намоз) қолдирганим учун ўзимга ${log.penaltyDebt} сомони эҳсон қилишни жарима қилиб белгилаган эдим. Лекин нафсим балосига гирифтор бўлиб, шу садақани ҳам 24 соат ичида қилмадим.\n\nИлтимос, шу хатни ўқигач, менга қўнғироқ қилинг ва нега бундай қилганимни қаттиқ сўроқ қилинг. Менга сизнинг назоратингиз керак.`;
          
          for (let phone of CONFIG.nukeContacts) {
            await userbot.sendMessage(phone, { message });
          }
          await bot.sendMessage(CONFIG.adminId, `☢️ **ЯДЕРНИЙ ЗАРБА БЕРИЛДИ!**\nСенинг яқинларингга сен номингдан хабар юборилди. Умид қиламанки, бу сенга дарс бўлади.`);
        } else {
          await bot.sendMessage(CONFIG.adminId, `⚠️ **ВЗРЫВ ОТМЕНЕН.** Юзербот созланмаган. Лекин сен барибир ютқаздинг.`);
        }

        log.nukeTriggered = true;
        await log.save();
      } 
      // СТАДИЯ 2: ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ (> 20 часов)
      else if (hoursPassed >= 20 && !log.warning20hSent) {
        const timeLeft = Math.floor(24 - hoursPassed);
        const msg = `🚨 **СЎНГГИ ОГОҲЛАНТИРИШ!**\n\nЭҳсон қилишга атиги ${timeLeft} соат қолди. Бўйнингда ${log.penaltyDebt} сомони қарз бор.\nАгар тўламасанг, яқинларингга иқрорлик хати кетади! Ўзингни қўлга ол, шифокор!`;
        await bot.sendMessage(CONFIG.adminId, msg, { parse_mode: 'Markdown' });
        
        log.warning20hSent = true;
        await log.save();
      }
    }
  } catch (err) {
    console.error("Cron Escalation Error:", err);
  }
});

// ==========================================
// 5. AI МИЯ (ГЕМИНИ)
// ==========================================
bot.on('voice', async (msg) => {
  if (msg.from.id.toString() !== CONFIG.adminId) return bot.sendMessage(msg.chat.id, "⛔ Кечирасиз, бу шахсий бот.");
  
  const loadingMsg = await bot.sendMessage(msg.chat.id, "🧠 Акангиз ўйламоқда...");
  try {
    const fileLink = await bot.getFileLink(msg.voice.file_id);
    const { data } = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const base64Audio = Buffer.from(data).toString('base64');

    const prompt = `Рол: Сен Жавоҳирнинг қаттиққўл, лекин меҳрибон катта акасисан. Контекст: Жавоҳир 4-курс тиббиёт талабаси (USMLE). Вазифа: Агар дангасалик қилса - қаттиқ терга. Агар чарчаса - мотивация бер. Қисқа ва лўнда гапир. Тил: Ўзбек (Кирилл).`;

    const result = await aiModel.generateContent([ prompt, { inlineData: { mimeType: "audio/ogg", data: base64Audio } } ]);
    await bot.editMessageText(`🤖 **Ака:** ${result.response.text()}`, { chat_id: msg.chat.id, message_id: loadingMsg.message_id, parse_mode: 'Markdown' });
  } catch (error) {
    bot.editMessageText("⚠️ Овозни таниб бўлмади ёки Gemini сервери банд.", { chat_id: msg.chat.id, message_id: loadingMsg.message_id });
  }
});

// ==========================================
// 6. СТАНДАРТНЫЕ CRON РАССЫЛКИ
// ==========================================
cron.schedule('0 6 * * *', async () => {
  await bot.sendMessage(CONFIG.adminId, `🌅 **Ассаламу алайкум!**\n\nСоат 06:00. Нейрохирургия кутиб турмайди.\nИловага кириб бугунги кун режасини тузинг!`, { parse_mode: 'Markdown' });
}, { timezone: "Asia/Tashkent" });

cron.schedule('0 22 * * *', async () => {
  const date = new Date().toISOString().split('T')[0];
  const log = await DayLog.findOne({ userId: MASTER_EMAIL, date });
  if (!log || (log.score || 0) < 50) {
    await bot.sendMessage(CONFIG.adminId, `😡 **Жавоҳир!**\n\nСоат 22:00 бўлди, натижа 50% дан паст. Иловага кириб вазифаларни белгила ёки эртага қарздор бўласан!`, { parse_mode: 'Markdown' });
  }
}, { timezone: "Asia/Tashkent" });

// ==========================================
// 7. КОМАНДЫ БОТА
// ==========================================
const kb = { reply_markup: { keyboard: [['📊 Статус', '🤲 Намоз +1'], ['💀 Срыв (Нафс)', '💰 Қарз текшириш']], resize_keyboard: true } };

bot.onText(/\/start/, (msg) => {
  if (msg.from.id.toString() !== CONFIG.adminId) return;
  bot.sendMessage(msg.chat.id, "Бот (v3.0 - Hardcore) ишга тушди! Буйруқ беринг, Доктор.", kb);
});

// Статус
bot.onText(/📊 Статус/, async (msg) => {
  if (msg.from.id.toString() !== CONFIG.adminId) return;
  const log = await DayLog.findOne({ userId: MASTER_EMAIL, date: new Date().toISOString().split('T')[0] });
  const debt = log?.penaltyDebt || 0;
  bot.sendMessage(msg.chat.id, `📅 **${new Date().toISOString().split('T')[0]}**\n📈 Балл: ${log?.score || 0}%\n💰 Қарз: ${debt} с.`, { parse_mode: 'Markdown' });
});

// Срыв (Назначение штрафа с таймером)
bot.onText(/💀 Срыв/, async (msg) => {
  if (msg.from.id.toString() !== CONFIG.adminId) return;
  const date = new Date().toISOString().split('T')[0];
  let log = await DayLog.findOne({ date });
  if (!log) log = new DayLog({ date });

  // Если это первый штраф, запускаем таймер смерти
  if (!log.penaltyDebt || log.penaltyDebt === 0) {
    log.debtCreatedAt = new Date();
    log.warning20hSent = false;
    log.nukeTriggered = false;
  }
  
  log.penaltyDebt = (log.penaltyDebt || 0) + 50;
  await log.save();
  
  bot.sendMessage(msg.chat.id, `⚠️ **СРЫВ!** Жарима +50 сомони.\n⏳ **ТАЙМЕР ИШГА ТУШДИ.** Сенда 24 соат вақт бор эҳсон қилишга!`, { parse_mode: 'Markdown' });
});

bot.on('polling_error', (error) => {}); // Игнор мелких ошибок сети

// Render учун HTTP сервер
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(process.env.PORT || 3000);
