const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend } = require('../utils/telegram');
const { getToday } = require('../utils/dates');
const DayLog = require('../models/DayLog');
const splitMessage = require('../utils/splitMessage');
const { getCurrentLevel } = require('../utils/streakLevels');

function scheduleNightAnalysis(bot, callGemini) {
  cron.schedule('5 22 * * *', async () => {
    const masterEmail = 'javo.nur.2004@gmail.com';
    try {
      const log = await DayLog.findOne({ userId: masterEmail, date: getToday() });

      // Если нет почасовых ответов — отправляем статистику дня
      if (!log || !log.hourlyResponses || log.hourlyResponses.length === 0) {
        const summaryMsg =
          `📊 *КУНЛИК ҲИСОБОТ*\n\n` +
          `😔 Бугун соатлик жавоб берилмади.\n\n` +
          `📈 *Кун статистикаси:*\n` +
          `• Балл: ${log?.score || 0}%\n` +
          `• 🇩🇪 Немецкий: ${log?.academic?.germanMinutes || 0} мин\n` +
          `• 🔁 Anki: ${log?.academic?.ankiDone || 0} карта\n` +
          `• 🤲 Намоз: ${log?.spiritual?.prayersDone || 0}/5\n` +
          `• 🏃 Спорт: ${log?.sport?.didSport ? 'Ҳа' : 'Йўқ'}\n` +
          `• 💰 Қарз: ${log?.penaltyDebt || 0} сомони\n\n` +
          `_Эртага ҳар соатда жавоб бер — ўзингни назорат қил._`;
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId, summaryMsg);
        }
        return;
      }

      // Уведомляем о начале анализа
      for (const tgId of ALLOWED_TG_IDS) {
        await safeSend(bot, tgId, `🧠 *AI таҳлил тайёрланмоқда...*\n📝 ${log.hourlyResponses.length} та жавоб`);
      }

      // Сортируем ответы по часам
      const responsesList = log.hourlyResponses
        .sort((a, b) => a.hour - b.hour)
        .map(r => `• ${r.time} — "${r.text}"`)
        .join('\n');

      // Формируем промпт для AI
      const prompt = `Сен Жавоҳирнинг шахсий AI-коучисан. У 4-курс тиббиёт студенти, мақсади — Германияда нейрохирург бўлиш.

Бугунги соатлик жавоблар:
${responsesList}

Сайтдаги кун статистикаси:
📊 Балл: ${log.score || 0}%
🔁 Anki: ${log.academic?.ankiDone || 0} карта
🤲 Намоз: ${log.spiritual?.prayersDone || 0}/5
🏃 Спорт: ${log.sport?.didSport ? 'Ҳа' : 'Йўқ'}
🌙 Тоҳажжуд: ${log.spiritual?.tahajjud ? 'Ҳа' : 'Йўқ'}
📖 Қуръон: ${log.spiritual?.quranPages || 0} бет

JSON форматда чуқур таҳлил:
{
  "mood_curve": "кун давомида руҳий ҳолат",
  "peak_hours": "энг самарали соатлар",
  "low_hours": "сустлик соатлари ва сабаби",
  "real_progress": "ҳақиқий прогресс — очиқ баҳо",
  "problems": "аниқланган муаммолар",
  "tomorrow_plan": "эртага 3 та конкрет қадам",
  "score": <1-10 сон>,
  "motivation": "якуний мотивациявий сўз (2 жумла)"
}
ФАҚАТ JSON.`;

      const raw = await callGemini(prompt);
      let analysis;
      try {
        analysis = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch {
        // Если не удалось распарсить JSON, отправляем сырой ответ
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId, `📊 *Кунлик таҳлил:*\n\n${raw}`);
        }
        return;
      }

      const scoreEmoji = analysis.score >= 8 ? '🏆' : analysis.score >= 6 ? '✅' : analysis.score >= 4 ? '⚠️' : '❌';
      const message =
        `📊 *КУНЛИК AI ТАҲЛИЛ*\n\n` +
        `${scoreEmoji} *Кун баҳоси: ${analysis.score}/10*\n\n` +
        `🧠 *Руҳий ҳолат:*\n${analysis.mood_curve}\n\n` +
        `⚡ *Самарали соатлар:*\n${analysis.peak_hours}\n\n` +
        `🔻 *Сустлик:*\n${analysis.low_hours}\n\n` +
        `🎯 *Ҳақиқий прогресс:*\n${analysis.real_progress}\n\n` +
        `⚠️ *Муаммолар:*\n${analysis.problems}\n\n` +
        `📋 *Эртага:*\n${analysis.tomorrow_plan}\n\n` +
        `💪 _${analysis.motivation}_`;

      // Отправляем анализ по частям, если нужно
      for (const tgId of ALLOWED_TG_IDS) {
        for (const part of splitMessage(message)) {
          await safeSend(bot, tgId, part);
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Обновление стрика при хорошем дне (score >= 6)
      if ((analysis.score || 0) >= 6) {
        const oldStreak = log.streak || 0;
        log.streak = oldStreak + 1;
        await log.save();

        const newLevel = getCurrentLevel(log.streak);
        const prevLevel = getCurrentLevel(oldStreak);

        // Если достигнут новый уровень — поздравляем
        if (log.streak > 1 && newLevel.name !== prevLevel.name) {
          for (const tgId of ALLOWED_TG_IDS) {
            await safeSend(bot, tgId,
              `${newLevel.emoji} *ЯНГИ ДАРАЖА!*\n\n` +
              `Сиз *${newLevel.name}* бўлдингиз!\n` +
              `Стрик: ${log.streak} кун.\n` +
              `_Давом этинг, доктор!_`
            );
          }
        } else if (log.streak > 1) {
          for (const tgId of ALLOWED_TG_IDS) {
            await safeSend(bot, tgId, `🔥 *Стрик: ${log.streak} кун!* Давом эт!`);
          }
        }
      }
    } catch (err) {
      console.error("Night analysis error:", err.message);
    }
  }, { timezone: CONFIG.timezone });
}

module.exports = scheduleNightAnalysis;
