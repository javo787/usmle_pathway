const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { getTashkentDate, getToday, DAY_NAMES } = require('../utils/dates');
const { safeSend } = require('../utils/telegram');
let UserProfile, DayLog;
async function getModels() {
    if (!UserProfile) UserProfile = (await import('../models/UserProfile.js')).default;
    if (!DayLog) DayLog = (await import('../models/DayLog.js')).default;
}

function scheduleMorningGreeting(bot) {
  // Проверяем каждую минуту, нужно ли отправить приветствие
  cron.schedule('* * * * *', async () => {
    await getModels();
const now = getTashkentDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = getToday();

    const masterEmail = 'javo.nur.2004@gmail.com';
    try {
      const profile = await UserProfile.findOne({ masterEmail });
      const wakeUpTime = profile?.wakeUpTime || '05:55'; // по умолчанию
      const [wHour, wMinute] = wakeUpTime.split(':').map(Number);

      if (currentHour === wHour && currentMinute === wMinute) {
        // Проверим, не отправляли ли уже сегодня
        const log = await DayLog.findOne({ userId: masterEmail, date: today });
        if (log?.morningGreetingSent) return;

        const day = DAY_NAMES[now.getDay()];
        const goals = profile?.goals || { germanMinutes: 45, anki: 50, uniHours: 4 };
        const msg = `🌅 *Ассаламу алайкум! ${day} муборак!*\n\n📋 *Бугунги мақсадлар:*\n🇩🇪 Немецкий — ${goals.germanMinutes}+ дақиқа\n🔁 Anki — ${goals.anki}+ карточка\n🏥 Универ/Кафедра — ${goals.uniHours}+ соат\n🤲 Намоз — 5 вақт\n🏃 Спорт — ҳаракат\n\n_Нейрохирургия сени кутяпти, доктор!_ 💪`;

        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId, msg);
        }

        // Фиксируем отправку в DayLog (если лог уже есть, обновляем; если нет — создаём)
        await DayLog.updateOne(
          { userId: masterEmail, date: today },
          { $set: { morningGreetingSent: true } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('Morning greeting error:', err.message);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleMorningGreeting;
