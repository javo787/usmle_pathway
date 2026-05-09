const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { getTashkentHour, getTashkentTime } = require('../utils/dates');
const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');

function scheduleHourlyQuestions(bot) {
  cron.schedule('0 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22 * * *', async () => {
    const hour = getTashkentHour();
    const time = getTashkentTime();
    let question;
    if (hour < 9)       question = `🌅 *${time}* — Субҳ вақти!\n\n*Нима билан бошладингиз? Максадга биринчи қадам қўйдингизми?* 🎯\n\nЖавобингизни ёзинг.`;
    else if (hour < 13) question = `⚡ *${time}* — Тонгги самара!\n\n*Нима қилавоссиз? Немецкий/Anki/Универ — қайси бирида?* 📚\n\nЖавобингизни ёзинг.`;
    else if (hour < 16) question = `☀️ *${time}* — Тушлик кейин...\n\n*Максад томон кетавоссизми? Ёки нафс ютдими?* 💪\n\nЖавобингизни ёзинг.`;
    else if (hour < 19) question = `🌆 *${time}* — Кечқурун!\n\n*Кун режаси бажарилмоқдами?* 📋\n\nЖавобингизни ёзинг.`;
    else                question = `🌙 *${time}* — Кун якунлашмоқда...\n\n*Бугун нима ютдингиз? Нима кам бўлди?* 🤔\n\nЖавобингизни ёзинг.`;

    for (const tgId of ALLOWED_TG_IDS) {
      const masterEmail = getMasterEmail(tgId, CONFIG.userMap);
      if (!masterEmail) continue;
      try {
        const log = await getOrCreateLog(masterEmail);
        log.questionPending = true;
        log.currentQuestionHour = hour;
        await log.save();
        await safeSend(bot, tgId, question);
      } catch (e) {
        console.error(`Hourly poll error [${tgId}]:`, e.message);
      }
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleHourlyQuestions;
