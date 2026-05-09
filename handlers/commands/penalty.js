const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog, syncDebtToProfile } = require('../../utils/dbHelpers');
const { getCurrentLevel } = require('../../utils/streakLevels');

module.exports = (bot) => {
  bot.onText(/💀 Срыв/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const masterEmail = getMasterEmail(tgId, CONFIG.userMap);
    const log = await getOrCreateLog(masterEmail);

    // Штраф
    if (!log.debtCreatedAt || (log.penaltyDebt || 0) === 0) {
      log.debtCreatedAt = new Date();
      log.warning12hSent = false;
      log.warning20hSent = false;
      log.nukeTriggered = false;
    }
    log.penaltyDebt = (log.penaltyDebt || 0) + 50;

    // Сброс стрика
    const oldStreak = log.streak || 0;
    if (oldStreak > 0) {
      const oldLevel = getCurrentLevel(oldStreak);
      log.streak = 0;
      // После сохранения отправим мотивацию
    }

    await log.save();
    await syncDebtToProfile(masterEmail, log.penaltyDebt, log.debtCreatedAt);

    let message =
      `💀 *СРЫВ ҚАЙД ЭТИЛДИ!*\n\n` +
      `⚠️ Жарима: +50 сомони\n` +
      `💰 Жами қарз: *${log.penaltyDebt} сомони*\n` +
      `⏳ 24 соатлик таймер ишга тушди!\n\n`;

    if (oldStreak > 0) {
      const oldLevel = getCurrentLevel(oldStreak);
      message += `🔥 Стрик *${oldStreak} кун* (${oldLevel.emoji} ${oldLevel.name}) обнулился.\n`;
      message += `_Ҳар бир йиқилиш — янги кўтарилиш учун сабаб._\n`;
    }

    message += `_Сайтда ҳам кўриниш бор. Агар тўламасанг — ядерний протокол!_ ☢️`;

    await safeSend(bot, tgId, message);
  });
};
