const { safeSend, isAllowed, getMasterEmail, escapeMarkdown } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');
const splitMessage = require('../../utils/splitMessage');

module.exports = (bot, { callGemini }) => {
  bot.onText(/🧠 AI Таҳлил/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const log = await getOrCreateLog(getMasterEmail(tgId, CONFIG.userMap));
    const responses = log.hourlyResponses || [];
    if (responses.length < 2) return safeSend(bot, tgId, '📝 Таҳлил учун камида *2 та* жавоб керак.');

    const loading = await bot.sendMessage(tgId, '🧠 AI таҳлил қилмоқда...');
    try {
      const list = responses.sort((a, b) => a.hour - b.hour).map(r => `• ${r.time} — "${r.text}"`).join('\n');
      const analysis = await callGemini(
        `Медицина студентининг бугунги жавоблари:\n${list}\nАнки: ${log.academic?.ankiDone || 0}, Намоз: ${log.spiritual?.prayersDone || 0}/5\nЎзбек кирилл, 5-7 жумла: нима яхши, нима ёмон, эртага нима қилсин.`
      );

      // Удаляем сообщение-заглушку
      await bot.deleteMessage(tgId, loading.message_id).catch(() => {});

      // Формируем ответ: первая строка с заголовком, остальное — экранированный текст
      const header = '🧠 AI Таҳлил:';
      const escaped = escapeMarkdown(analysis);  // на всякий случай, если будем слать без Markdown
      const fullText = header + '\n\n' + escaped + '

';
      const parts = splitMessage(fullText);

      // Отправляем все части как новые сообщения без Markdown
      for (const part of parts) {
        await safeSend(bot, tgId, part, { parse_mode: undefined }); // принудительно без парсинга
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.error('aiAnalysis error:', e.message);
      await bot.deleteMessage(tgId, loading.message_id).catch(() => {});
      await safeSend(bot, tgId, '⚠️ AI хато.');
    }
  });
};
