const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { getTashkentDate, DAY_NAMES } = require('../utils/dates');
const { safeSend } = require('../utils/telegram');
const UserProfile = require('../models/UserProfile');

function scheduleMorningGreeting(bot) {
  cron.schedule('55 5 * * *', async () => {
    const day = DAY_NAMES[getTashkentDate().getDay()];
    const profile = await UserProfile.findOne({ masterEmail: 'javo.nur.2004@gmail.com' });
    const goals = profile?.goals || { germanMinutes: 45, anki: 50, uniHours: 4 };
    const msg = `🌅 *Ассаламу алайкум! ${day} муборак!*\n\n📋 *Бугунги мақсадлар:*\n🇩🇪 Немецкий — ${goals.germanMinutes}+ дақиқа\n🔁 Anki — ${goals.anki}+ карточка\n🏥 Универ/Кафедра — ${goals.uniHours}+ соат\n🤲 Намоз — 5 вақт\n🏃 Спорт — ҳаракат\n\n_Нейрохирургия сени кутяпти, доктор!_ 💪`;

    for (const tgId of ALLOWED_TG_IDS) {
      await safeSend(bot, tgId, msg);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleMorningGreeting;
