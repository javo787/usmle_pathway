// handlers/messageHandler.js
const { CONFIG } = require('../config');
const { safeSend, getMasterEmail, isAllowed, escapeMarkdown } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');
const splitMessage = require('../utils/splitMessage');

function setupMessageHandler(bot, { callGemini }) {
  bot.on('message', async (msg) => {
    try {
      const tgId = msg.from.id.toString();
      if (!isAllowed(tgId, CONFIG.userMap)) return;
      if (!msg.text || msg.text.startsWith('/')) return;

      // Меню кнопкаларини игнорлаймиз — уларни commands handlers ушлайди
      const MENU_CMDS = ['📊', '📝', '🤲', '💀', '💰', '🧠', '🏆', '❓'];
      if (MENU_CMDS.some(cmd => msg.text.startsWith(cmd))) return;

      const masterEmail = getMasterEmail(tgId, CONFIG.userMap);

      // ── DB га мурожаат (хатолик бўлса — фақат AI chat ишлайди) ──
      let log = null;
      try {
        log = await getOrCreateLog(masterEmail);
      } catch (dbErr) {
        console.error('DB error in messageHandler:', dbErr.message);
      }

      // 1. Соатлик жавоб (фақат log мавжуд бўлса)
      if (log && log.questionPending && log.currentQuestionHour != null) {
        const already = log.hourlyResponses.some(r => r.hour === log.currentQuestionHour);
        if (already) {
          await safeSend(bot, tgId, '✅ Бу соат учун жавоб аллақачон сақланган.');
          return;
        }

        const time = `${String(log.currentQuestionHour).padStart(2, '0')}:00`;
        let aiReaction = '';
        try {
          const prompt = `Медицина студенти (нейрохирургия мақсади). Соат ${time} да ёзди: "${msg.text.trim()}". 1-2 жумла: мотивация ёки огоҳлантириш. Ўзбек кирилл.`;
          aiReaction = await callGemini(prompt);
        } catch {
          aiReaction = '';
        }

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

        await safeSend(bot, tgId, aiReaction
          ? `✅ *Жавоб сақланди*\n\n🤖 ${escapeMarkdown(aiReaction)}`
          : `✅ Жавобингиз сақланди _(${time})_`
        );
        return;
      }

      // 2. Эркин AI чат
      const loading = await bot.sendMessage(tgId, '🧠 Ўйламоқда...');
      try {
        const reply = await callGemini(
          `Сен Жавоҳирнинг AI-коучисан. У 4-курс тиббиёт студенти, нейрохирург бўлишни мақсад қилган (Германия).\nУ ёзди: "${msg.text}"\nЎзбек кирилл, 3-4 жумла, аниқ ва лўнда.`
        );

        const fullText = `🤖 ${escapeMarkdown(reply)}`;
        const parts = splitMessage(fullText);

        try {
          await bot.editMessageText(parts[0], {
            chat_id: msg.chat.id,
            message_id: loading.message_id
          });
        } catch {
          await bot.deleteMessage(tgId, loading.message_id).catch(() => {});
          await safeSend(bot, tgId, parts[0]);
        }

        for (let i = 1; i < parts.length; i++) {
          await safeSend(bot, tgId, parts[i]);
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (err) {
        console.error('Free chat AI error:', err.message);
        await bot.editMessageText('⚠️ AI жавоб беришда хато.', {
          chat_id: msg.chat.id,
          message_id: loading.message_id
        }).catch(async () => {
          await bot.deleteMessage(tgId, loading.message_id).catch(() => {});
          await safeSend(bot, tgId, '⚠️ AI жавоб беришда хато.');
        });
      }

    } catch (fatalErr) {
      // Ҳеч қандай ошмаган хатолик — логлаймиз, бот ишлашда давом этади
      console.error('Fatal messageHandler error:', fatalErr.message);
    }
  });
}

module.exports = setupMessageHandler;
