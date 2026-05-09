const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend } = require('../utils/telegram');
const { getToday, DAY_NAMES, getTashkentDate } = require('../utils/dates');
const DayLog = require('../models/DayLog');
const UserProfile = require('../models/UserProfile');

function scheduleWeeklyReport(bot, callGemini) {
  cron.schedule('0 21 * * 0', async () => {
    const masterEmail = 'javo.nur.2004@gmail.com';

    try {
      // Определяем диапазон дат: предыдущие 7 дней (пн–вс)
      const now = getTashkentDate();
      const dayOfWeek = now.getDay(); // 0 = воскресенье
      // Последний завершённый день — суббота (если сегодня воскресенье, то отчёт за прошлую неделю)
      const endDate = new Date(now);
      endDate.setDate(now.getDate() - 1); // суббота
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6); // понедельник

      const format = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const start = format(startDate);
      const end = format(endDate);

      // Получаем все логи за период
      const logs = await DayLog.find({
        userId: masterEmail,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      if (!logs.length) {
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId, '📊 *Ҳафталик ҳисобот*\n\nБу ҳафта маълумот топилмади.');
        }
        return;
      }

      // Собираем агрегаты
      let totalGerman = 0, totalAnki = 0, totalPrayers = 0, totalDays = 0;
      let totalPenalty = 0, totalRelapses = 0;
      let bestScore = -1, worstScore = 101;
      let bestDay = '', worstDay = '';
      const goalGerman = 45 * 7; // цель в минутах за неделю (можно брать из профиля)
      const goalAnki = 50 * 7;   // аналогично
      const goalPrayers = 5 * 7;

      const profile = await UserProfile.findOne({ masterEmail });
      const goals = profile?.goals || { germanMinutes: 45, anki: 50, uniHours: 4 };
      const targetGerman = goals.germanMinutes * 7;
      const targetAnki = goals.anki * 7;
      const targetPrayers = 35;

      for (const log of logs) {
        totalGerman += log.academic?.germanMinutes || 0;
        totalAnki += log.academic?.ankiDone || 0;
        totalPrayers += log.spiritual?.prayersDone || 0;
        totalPenalty += log.penaltyDebt || 0; // сумма долгов за все дни (но это не очень корректно, лучше взять текущий долг, но для отчёта можно использовать сумму штрафов)
        totalDays++;
        if (log.spiritual?.nafsRelapse) totalRelapses++;

        const score = log.score || 0;
        if (score > bestScore) {
          bestScore = score;
          bestDay = log.date;
        }
        if (score < worstScore) {
          worstScore = score;
          worstDay = log.date;
        }
      }

      // Текущий долг (последний актуальный)
      const lastLog = logs[logs.length - 1];
      const currentDebt = lastLog.penaltyDebt || 0;

      const germanPercent = targetGerman ? Math.round((totalGerman / targetGerman) * 100) : 0;
      const ankiPercent = targetAnki ? Math.round((totalAnki / targetAnki) * 100) : 0;
      const prayerPercent = targetPrayers ? Math.round((totalPrayers / targetPrayers) * 100) : 0;

      // Форматируем даты для "лучшего" и "худшего" дня
      const getDayName = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return DAY_NAMES[d.getDay()];
      };
      const bestDayName = bestDay ? getDayName(bestDay) : '—';
      const worstDayName = worstDay ? getDayName(worstDay) : '—';

      // AI итоговая оценка
      let aiSummary = '';
      try {
        const prompt = `Сен Жавоҳирнинг AI-коучисан. Ҳафталик натижалар:
- Немецкий: ${totalGerman}/${targetGerman} мин (${germanPercent}%)
- Anki: ${totalAnki}/${targetAnki} карт (${ankiPercent}%)
- Намоз: ${totalPrayers}/${targetPrayers} вақт (${prayerPercent}%)
- Срывлар: ${totalRelapses}
- Жарима: ${currentDebt} сомони
- Энг яхши кун: ${bestDayName} (${bestScore}%)
- Энг ёмон кун: ${worstDayName} (${worstScore}%)

2-3 жумлада умумий баҳо ва эртаги ҳафтага маслаҳат. Ўзбек кирилл.`;
        aiSummary = await callGemini(prompt);
      } catch (e) {
        aiSummary = 'AI баҳолашда хатолик.';
      }

      const message =
        `📊 *ҲАФТАЛИК ҲИСОБОТ*\n` +
        `📅 ${start} – ${end}\n\n` +
        `🇩🇪 Немецкий: ${totalGerman}/${targetGerman} мин (${germanPercent}%)\n` +
        `🔁 Anki: ${totalAnki}/${targetAnki} карта (${ankiPercent}%)\n` +
        `🤲 Намоз: ${totalPrayers}/${targetPrayers} (${prayerPercent}%)\n` +
        `💀 Срывлар: ${totalRelapses} та\n` +
        `💰 Жорий жарима: ${currentDebt} сомони\n\n` +
        `⭐ Энг яхши кун: ${bestDayName} (${bestScore}%)\n` +
        `🌧 Энг ёмон кун: ${worstDayName} (${worstScore}%)\n\n` +
        `🧠 *AI якуний баҳо:*\n${aiSummary}`;

      for (const tgId of ALLOWED_TG_IDS) {
        await safeSend(bot, tgId, message);
      }
    } catch (err) {
      console.error('Weekly report error:', err.message);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleWeeklyReport;
