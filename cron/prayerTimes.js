const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');
const { getPrayerTimes } = require('../config/prayerTimes');

function schedulePrayerTimes(bot) {
  cron.schedule('* * * * *', async () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: CONFIG.timezone }));
    const times = getPrayerTimes(now);
    if (!times) return;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (const prayer of times) {
      // Уведомление ровно во время намаза (или за 5 минут? пусть будет ровно во время)
      if (currentHour === prayer.hour && currentMinute === prayer.minute) {
        for (const tgId of ALLOWED_TG_IDS) {
          const keyboard = {
            inline_keyboard: [[
              { text: 'Ҳа ✅', callback_data: `prayer_yes_${prayer.name}` },
              { text: 'Йўқ ❌', callback_data: `prayer_no_${prayer.name}` }
            ]]
          };
          await safeSend(bot, tgId,
            `🕌 *${prayer.name} вақти кирди!*\nНамоз ўқидингизми?`,
            { reply_markup: keyboard }
          );
        }
      }
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = schedulePrayerTimes;
