const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');
const { getToday, getTashkentHour, DAY_NAMES, getTashkentDate } = require('../../utils/dates');

module.exports = (bot) => {
  bot.onText(/📊 Статус/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const masterEmail = getMasterEmail(tgId, CONFIG.userMap);
    const log = await getOrCreateLog(masterEmail);
    const hour = getTashkentHour();
    const expected = Math.max(0, hour - 5);
    const answered = (log.hourlyResponses || []).length;
    const rate = expected > 0 ? Math.round((answered / expected) * 100) : 0;

    let debtInfo = '';
    if ((log.penaltyDebt || 0) > 0 && log.debtCreatedAt) {
      const passed = ((new Date() - new Date(log.debtCreatedAt)) / 3600000).toFixed(1);
      const left = Math.max(0, 24 - passed).toFixed(1);
      debtInfo = `\n⏳ Таймер: ${passed}ч / қолди: *${left} соат*`;
    }

    await safeSend(bot, tgId,
      `📅 *${getToday()}* — ${DAY_NAMES[getTashkentDate().getDay()]}\n\n` +
      `📈 *Балл (сайт):* ${log.score || 0}%\n` +
      `🔁 Anki: ${log.academic?.ankiDone || 0} карта\n` +
      `🤲 Намоз: ${log.spiritual?.prayersDone || 0}/5\n` +
      `🌙 Тоҳажжуд: ${log.spiritual?.tahajjud ? '✅' : '❌'}\n` +
      `📖 Қуръон: ${log.spiritual?.quranPages || 0} бет\n` +
      `🏃 Спорт: ${log.sport?.didSport ? '✅' : '❌'}\n\n` +
      `💬 Жавоблар: ${answered}/${expected} (${rate}%)\n` +
      `💰 Қарз: *${log.penaltyDebt || 0} сом*${debtInfo}`
    );
  });
};
