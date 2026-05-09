const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');
const { getCurrentLevel, getNextLevel } = require('../../utils/streakLevels');

module.exports = (bot) => {
  bot.onText(/🏆 Стрик/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const log = await getOrCreateLog(getMasterEmail(tgId, CONFIG.userMap));
    const streak = log.streak || 0;

    const current = getCurrentLevel(streak);
    const next = getNextLevel(streak);

    let progress = '';
    if (next) {
      const needed = next.min - streak;
      progress = `\nКейинги даража: *${next.emoji} ${next.name}* (${needed} кун қолди)`;
    } else {
      progress = `\n🏁 *Максимал даража!*`;
    }

    await safeSend(bot, tgId,
      `${current.emoji} *Стрик: ${streak} кун*\n` +
      `Даража: *${current.name}*\n` +
      `Жорий: ${streak} кун${progress}\n\n` +
      (streak === 0 ? 'Ҳали бошланмади. Бугун яхши кун ўтказ!' :
       streak < 3   ? 'Яхши бошланиш! Давом эт.' :
       streak < 7   ? 'Бир ҳафта сари илдам!' :
       streak < 14  ? 'Икки ҳафтага бордингиз!' :
       streak < 30  ? 'Бир ойлик маррага яқин!' : 'Тарих ёзвозсиз!')
    );
  });
};
