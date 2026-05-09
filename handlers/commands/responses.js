const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');
const splitMessage = require('../../utils/splitMessage');

module.exports = (bot) => {
  bot.onText(/📝 Жавоблар/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const log = await getOrCreateLog(getMasterEmail(tgId, CONFIG.userMap));
    const responses = log.hourlyResponses || [];
    if (!responses.length) return safeSend(bot, tgId, '📝 Бугун ҳали жавоб берилмади.');

    const list = responses
      .sort((a, b) => a.hour - b.hour)
      .map(r => `⏰ *${r.time}*\n└ ${r.text}${r.aiReaction ? `\n└ 🤖 _${r.aiReaction}_` : ''}`)
      .join('\n\n');

    for (const part of splitMessage(`📝 *Бугунги жавоблар (${responses.length} та):*\n\n${list}`)) {
      await safeSend(bot, tgId, part);
      await new Promise(r => setTimeout(r, 300));
    }
  });
};
