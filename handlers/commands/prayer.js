const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');

module.exports = (bot) => {
  bot.onText(/🤲 Намоз \+1/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const log = await getOrCreateLog(getMasterEmail(tgId, CONFIG.userMap));
    const current = log.spiritual?.prayersDone || 0;
    if (current >= 5) return safeSend(bot, tgId, '✅ *Барча 5 вақт намоз ўқилган!* Маш Аллоҳ! 🤲');

    log.spiritual.prayersDone = current + 1;
    await log.save();

    const reactions = ['','Бисмиллаҳ! 1/5 🕌','2/5 — давом эт!','3/5 — ярмидан ошди! 💪','4/5 — яна битта!','🌟 *5/5 — Маш Аллоҳ!* Барака топинг! 🤲'];
    await safeSend(bot, tgId, `🤲 *Намоз ${current + 1}/5* ✅\n${reactions[current + 1]}`);
  });
};
