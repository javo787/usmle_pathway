const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend } = require('../utils/telegram');

function scheduleAntiRelapse(bot) {
  cron.schedule('0 22,0 * * *', async () => {
    for (const tgId of ALLOWED_TG_IDS) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📚 Ўқияпман', callback_data: 'anti_safe_read' },
            { text: '😴 Ухлаяпман', callback_data: 'anti_safe_sleep' }
          ],
          [
            { text: '⚠️ Хавфли', callback_data: 'anti_danger' }
          ]
        ]
      };

      await safeSend(bot, tgId,
        `🌙 *Кеч бўлди. Ирода пасаядиган вақт.*\n` +
        `Айнан шу соатларда одатлар синалади.\n` +
        `Ҳозир нима билан машғулсиз?`,
        { reply_markup: keyboard }
      );
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleAntiRelapse;
