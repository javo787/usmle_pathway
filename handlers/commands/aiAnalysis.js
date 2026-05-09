const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
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
};
