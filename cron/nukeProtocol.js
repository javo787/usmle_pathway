const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend, getMasterEmail } = require('../utils/telegram');
let DayLog;
async function getModels() {
    if (!DayLog) DayLog = (await import('../models/DayLog.js')).default;
}

function scheduleNukeProtocol(bot, userbot) {
  cron.schedule('*/30 * * * *', async () => {
    await getModels();
    try {
      const now = new Date();
      const debtors = await DayLog.find({
        penaltyDebt: { $gt: 0 },
        debtCreatedAt: { $ne: null },
        nukeTriggered: false
      });

      for (const log of debtors) {
        const hoursPassed = (now - new Date(log.debtCreatedAt)) / 3600000;
        const tgIds = Object.entries(CONFIG.userMap)
          .filter(([, email]) => email === log.userId)
          .map(([tgId]) => tgId);

        if (hoursPassed >= 24) {
          if (userbot && CONFIG.nukeContacts.length > 0) {
            const nukeMsg = `Ассалому алайкум. Мен бугун ... ${log.penaltyDebt} сомони ...`;
            for (const contact of CONFIG.nukeContacts) {
              try { await userbot.sendMessage(contact, { message: nukeMsg }); } catch (e) { console.error("Nuke:", e.message); }
            }
            for (const tgId of tgIds) await safeSend(bot, tgId, `☢️ *ЯДЕРНИЙ ЗАРБА БЕРИЛДИ!*\nЯқинларингга хабар юборилди.`);
          } else {
            for (const tgId of tgIds) await safeSend(bot, tgId, `⚠️ Юзербот йўқ. Қарз ${log.penaltyDebt} сом қолди!`);
          }
          log.nukeTriggered = true;
          await log.save();
        } else if (hoursPassed >= 20 && !log.warning20hSent) {
          const left = Math.floor(24 - hoursPassed);
          for (const tgId of tgIds) {
            await safeSend(bot, tgId, `🚨 *СЎНГГИ ОГОҲЛАНТИРИШ!*\n\n⏳ Қолди: *${left} соат*\n💰 Қарз: *${log.penaltyDebt} сомони*\n\nАгар тўламасанг — яқинларинг хабардор қилинади!`);
          }
          log.warning20hSent = true;
          await log.save();
        } else if (hoursPassed >= 12 && !log.warning12hSent) {
          const left = Math.floor(24 - hoursPassed);
          for (const tgId of tgIds) {
            await safeSend(bot, tgId, `⚠️ *Эслатма!* Қарз: ${log.penaltyDebt} сом. Қолди: ${left} соат.`);
          }
          log.warning12hSent = true;
          await log.save();
        }
      }
    } catch (err) {
      console.error("Nuke cron error:", err.message);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleNukeProtocol;
