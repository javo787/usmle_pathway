// handlers/messageHandler.js
const { CONFIG } = require('../config');
const { safeSend, getMasterEmail, isAllowed, escapeMarkdown } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');

const MENU_PREFIXES = ['📊', '📝', '🤲', '💀', '💰', '🧠', '🏆', '❓'];

const HOURLY_PROMPT = (time, text) =>
  `Медицина студенти (нейрохирургия мақсади). Соат ${time} да ёзди: "${text}". ` +
  `1-2 жумла: мотивация ёки огоҳлантириш. Ўзбек кирилл.`;

const CHAT_PROMPT = (text) =>
  `Сен Жавоҳирнинг AI-коучисан. У 4-курс тиббиёт студенти, нейрохирург бўлишни мақсад қилган (Германия).\n` +
  `У ёзди: "${text}"\n` +
  `Ўзбек кирилл, 3-4 жумла, аниқ ва лўнда.`;

// ─────────────────────────────────────────────
// Soatlik javob saqlash
// ─────────────────────────────────────────────
async function handleHourlyResponse(bot, tgId, msg, log, callGemini) {
  const hour = log.currentQuestionHour;
  const time = String(hour).padStart(2, '0') + ':00';

  const alreadyAnswered = log.hourlyResponses.some(r => r.hour === hour);
  if (alreadyAnswered) {
    await safeSend(bot, tgId, '✅ Бу соат учун жавоб аллақачон сақланган.');
    return;
  }

  let aiReaction = '';
  try {
    aiReaction = await callGemini(HOURLY_PROMPT(time, msg.text.trim()));
  } catch (err) {
    console.warn('[hourly] AI reaction failed:', err.message);
  }

  log.hourlyResponses.push({
    time,
    hour,
    text:      msg.text.trim(),
    aiReaction,
    savedAt:   new Date(),
  });
  log.questionPending    = false;
  log.currentQuestionHour = null;
  await log.save();

  const reply = aiReaction
    ? `✅ *Жавоб сақланди*\n\n🤖 ${escapeMarkdown(aiReaction)}`
    : `✅ Жавобингиз сақланди _(${time})_`;

  await safeSend(bot, tgId, reply);
}

// ─────────────────────────────────────────────
// Erkin AI chat
// ─────────────────────────────────────────────
async function handleFreeChat(bot, tgId, msg, callGemini) {
  const loadingMsg = await bot.sendMessage(tgId, '🧠 Ўйламоқда...');

  let reply;
  try {
    reply = await callGemini(CHAT_PROMPT(msg.text));
  } catch (err) {
    console.error('[freeChat] Gemini error:', err.message);
    await editOrSend(bot, tgId, loadingMsg, '⚠️ AI жавоб беришда хато. Қайта уриниб кўринг.');
    return;
  }

  const fullText = `🤖 ${escapeMarkdown(reply)}`;
  await editOrSend(bot, tgId, loadingMsg, fullText);
}

// ─────────────────────────────────────────────
// Edit yuklanayotgan xabarni yoki yangi yuborish
// ─────────────────────────────────────────────
async function editOrSend(bot, tgId, loadingMsg, text) {
  // safeSend ichida chunk'lash bor, lekin edit faqat birinchi qism uchun
  const MAX = 4096;
  const firstChunk  = text.slice(0, MAX);
  const restChunks  = [];

  for (let i = MAX; i < text.length; i += MAX) {
    restChunks.push(text.slice(i, i + MAX));
  }

  // Edit loading xabar
  try {
    await bot.editMessageText(firstChunk, {
      chat_id:    loadingMsg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
    });
  } catch {
    // Edit ishlamadi — o'chirib yangi yuboramiz
    await bot.deleteMessage(tgId, loadingMsg.message_id).catch(() => {});
    await safeSend(bot, tgId, firstChunk);
  }

  // Qolgan qismlarni alohida yuboramiz
  for (const chunk of restChunks) {
    await new Promise(r => setTimeout(r, 300));
    await safeSend(bot, tgId, chunk);
  }
}

// ─────────────────────────────────────────────
// Asosiy handler
// ─────────────────────────────────────────────
function setupMessageHandler(bot, { callGemini }) {
  bot.on('message', async (msg) => {
    try {
      const tgId = String(msg.from.id);

      // Filtrlar
      if (!isAllowed(tgId, CONFIG.userMap))                        return;
      if (!msg.text)                                               return;
      if (msg.text.startsWith('/'))                                return;
      if (MENU_PREFIXES.some(p => msg.text.startsWith(p)))        return;

      const masterEmail = getMasterEmail(tgId, CONFIG.userMap);

      // DB dan log olish
      let log = null;
      try {
        log = await getOrCreateLog(masterEmail);
      } catch (dbErr) {
        console.error('[messageHandler] DB error:', dbErr.message);
      }

      // Soatlik savol javobi
      if (log?.questionPending && log.currentQuestionHour != null) {
        await handleHourlyResponse(bot, tgId, msg, log, callGemini);
        return;
      }

      // Erkin chat
      await handleFreeChat(bot, tgId, msg, callGemini);

    } catch (fatal) {
      console.error('[messageHandler] Fatal error:', fatal.message, fatal.stack);
    }
  });
}

module.exports = setupMessageHandler;
