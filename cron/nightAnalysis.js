const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { safeSend, escapeMarkdown } = require('../utils/telegram');
const { getToday } = require('../utils/dates');
const DayLog = require('../models/DayLog');
const splitMessage = require('../utils/splitMessage');
const { getCurrentLevel } = require('../utils/streakLevels');

function scheduleNightAnalysis(bot, callGemini) {
  cron.schedule('5 22 * * *', async () => {
    const masterEmail = 'javo.nur.2004@gmail.com';
    try {
      const log = await DayLog.findOne({ userId: masterEmail, date: getToday() });

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

      for (const tgId of ALLOWED_TG_IDS) {
        await safeSend(bot, tgId, `🧠 *AI таҳлил тайёрланмоқда...*\n📝 ${log.hourlyResponses.length} та жавоб`);
      }

      const responsesList = log.hourlyResponses
        .sort((a, b) => a.hour - b.hour)
        .map(r => `• ${r.time} — "${r.text}"`)
        .join('\n');

      const prompt = `Сен Жавоҳирнинг шахсий AI-коучисан.
Бугунги соатлик жавоблар:
${responsesList}
Anki: ${log.academic?.ankiDone||0}, Намоз: ${log.spiritual?.prayersDone||0}/5, Балл: ${log.score||0}%

JSON ФАҚАТ (бошқа матн йўқ):
{
  "score": <1-10>,
  "mood_curve": "<кун давомида руҳий ҳолат қандай ўзгарди>",
  "peak_hours": "<энг самарали соатлар>",
  "low_hours": "<энг сустлик соатлари>",
  "real_progress": "<ҳақиқий прогресс борми>",
  "problems": "<асосий муаммолар>",
  "tomorrow_plan": "<эртага нима қилиш керак>",
  "motivation": "<қисқа мотивация>"
}`;

      const raw = await callGemini(prompt);
      let analysis;
      try {
        analysis = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch {
        for (const tgId of ALLOWED_TG_IDS) {
          await safeSend(bot, tgId, `📊 *Кунлик таҳлил:*\n\n${raw}`);
        }
        return;
      }

      const scoreEmoji = analysis.score >= 8 ? '🏆' : analysis.score >= 6 ? '✅' : analysis.score >= 4 ? '⚠️' : '❌';
      const message =
        `📊 *КУНЛИК AI ТАҲЛИЛ*\n\n` +
        `${scoreEmoji} *Кун баҳоси: ${analysis.score}/10*\n\n` +
        `🧠 *Руҳий ҳолат:*\n${escapeMarkdown(analysis.mood_curve)}\n\n` +
        `⚡ *Самарали соатлар:*\n${escapeMarkdown(analysis.peak_hours)}\n\n` +
        `🔻 *Сустлик:*\n${escapeMarkdown(analysis.low_hours)}\n\n` +
        `🎯 *Ҳақиқий прогресс:*\n${escapeMarkdown(analysis.real_progress)}\n\n` +
        `⚠️ *Муаммолар:*\n${escapeMarkdown(analysis.problems)}\n\n` +
        `📋 *Эртага:*\n${escapeMarkdown(analysis.tomorrow_plan)}\n\n` +
        `💪 _${escapeMarkdown(analysis.motivation)}_`;

      for (const tgId of ALLOWED_TG_IDS) {
        for (const part of splitMessage(message)) {
          await safeSend(bot, tgId, part);
          await new Promise(r => setTimeout(r, 400));
        }
      }

      if ((analysis.score || 0) >= 6) {
        const oldStreak = log.streak || 0;
        log.streak = oldStreak + 1;
        await log.save();

        const newLevel = getCurrentLevel(log.streak);
        const prevLevel = getCurrentLevel(oldStreak);

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
