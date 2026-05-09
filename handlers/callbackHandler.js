const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');
const { CONFIG } = require('../config');

function setupCallbackHandler(bot) {
  bot.on('callback_query', async (query) => {
    const tgId = query.from.id.toString();
    const masterEmail = getMasterEmail(tgId, CONFIG.userMap);
    if (!masterEmail) return;

    const [action, subtype, prayerName] = query.data.split('_');

    if (action === 'prayer') {
      const log = await getOrCreateLog(masterEmail);
      if (subtype === 'yes') {
        const current = log.spiritual.prayersDone || 0;
        if (current < 5) {
          log.spiritual.prayersDone = current + 1;
          await log.save();
          await bot.answerCallbackQuery(query.id, { text: `✅ ${prayerName} қабул бўлсин!` });
          await bot.editMessageText(
            `🕌 *${prayerName} — Аллоҳ қабул қилсин!* (${current + 1}/5)`,
            { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown' }
          );
        } else {
          await bot.answerCallbackQuery(query.id, { text: 'Бугун 5 вақт тўлди.' });
        }
      } else if (subtype === 'no') {
        await bot.answerCallbackQuery(query.id, { text: 'Кейинги намозни кутиб қолманг.' });
        await bot.editMessageText(
          `⚠️ *${prayerName} ўқилмади.* Асосийси кейингисида тузатиш.`,
          { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown' }
        );
      }
    }
  });
}

module.exports = setupCallbackHandler;
