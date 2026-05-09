const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend } = require('../utils/telegram');

function scheduleWakeUpPoll(bot) {
  cron.schedule('0 10 * * 0', async () => {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '05:00', callback_data: 'wakeup_05:00' },
          { text: '05:30', callback_data: 'wakeup_05:30' }
        ],
        [
          { text: '06:00', callback_data: 'wakeup_06:00' },
          { text: '06:30', callback_data: 'wakeup_06:30' }
        ]
      ]
    };

    for (const tgId of ALLOWED_TG_IDS) {
      await safeSend(bot, tgId,
        '⏰ *Янги ҳафта!*\nБу ҳафта соат нечада уйғонишни истайсиз?',
        { reply_markup: keyboard }
      );
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleWakeUpPoll;
