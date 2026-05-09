const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { getToday } = require('../utils/dates');
const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog, syncDebtToProfile } = require('../utils/dbHelpers');
const DayLog = require('../models/DayLog');

function schedulePlanDeadline(bot) {
  // 9:00 — предупреждение
  cron.schedule('0 9 * * *', async () => {
    const masterEmail = 'javo.nur.2004@gmail.com';
    try {
      const log = await DayLog.findOne({ userId: masterEmail, date: getToday() });
      const hasPlanned = log?.planning?.schedule?.trim().length > 5 ||
                         log?.planning?.tomorrowPlans?.some(t => t?.trim().length > 2);
      if (!hasPlanned) {
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId,
            `⚠️ *Соат 09:00!*\n\n` +
            `Сайтда режа топилмади.\n` +
            `Сизда *9:30 гача* вақт бор.\n\n` +
            `Акс ҳолда — *+15 сомони жарима* автоматик қўшилади.\n\n` +
            `👉 Дарҳол режа тузинг: https://muslim-doctor-v2.vercel.app`
          );
        }
      }
    } catch (err) {
      console.error('9:00 check error:', err.message);
    }
  }, { timezone: CONFIG.timezone });

  // 9:30 — жарима
  cron.schedule('30 9 * * *', async () => {
    const masterEmail = 'javo.nur.2004@gmail.com';
    try {
      const log = await getOrCreateLog(masterEmail);
      if (log.planDeadlinePenaltyApplied) return;

      const hasPlanned = log.planning?.schedule?.trim().length > 5 ||
                         log.planning?.tomorrowPlans?.some(t => t?.trim().length > 2);
      if (!hasPlanned) {
        const PENALTY = 15;
        const now = new Date();
        log.penaltyDebt = (log.penaltyDebt || 0) + PENALTY;
        log.debtCreatedAt = log.penaltyDebt === PENALTY ? now : log.debtCreatedAt;
        log.planDeadlinePenaltyApplied = true;
        log.warning12hSent = false;
        log.warning20hSent = false;
        log.nukeTriggered = false;
        await log.save();

        await syncDebtToProfile(masterEmail, log.penaltyDebt, log.debtCreatedAt);

        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId,
            `🚨 *09:30 ЎТДИ — ЖАРИМА!*\n\n` +
            `Режа тузилмади.\n` +
            `💰 *+${PENALTY} сомони* қарзга қўшилди.\n` +
            `💰 Жами қарз: *${log.penaltyDebt} сомони*\n\n` +
            `_Вақт Аллоҳнинг амонати. Уни беҳуда ўтказма._\n\n` +
            `Ҳозир сайтга кириб режа туз: https://muslim-doctor-v2.vercel.app`
          );
        }
      }
    } catch (err) {
      console.error('9:30 penalty error:', err.message);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = schedulePlanDeadline;
