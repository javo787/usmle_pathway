// cron/hourlyQuestions.js
const cron = require('node-cron');
const { CONFIG, ALLOWED_TG_IDS } = require('../config');
const { getTashkentHour, getTashkentTime } = require('../utils/dates');
const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');

// Вопросы строго по часам
const HOURLY_QUESTIONS = {
  6:  (time) => `🌅 *${time}* — Фажр вақти!\n\nФажр намозини ўқидингизми? Кун режангиз тайёрми? 📋\n\nЖавобингизни ёзинг.`,
  7:  (time) => `⏳ *${time}* — Илк қадам!\n\nРежадаги биринчи ишни бошладингизми? Немецкий ёки Anki? 📚\n\nЖавобингизни ёзинг.`,
  8:  (time) => `⚡ *${time}* — Тонгги самара!\n\nНемецкий бошладингизми? Неча дақиқа қилдингиз? 🇩🇪\n\nЖавобингизни ёзинг.`,
  9:  (time) => `📊 *${time}* — Назорат нуқтаси!\n\nРежа бўйича кетяпсизми? Кайфиятингиз қандай? 🎯\n\nЖавобингизни ёзинг.`,
  10: (time) => `🔁 *${time}* — Anki вақти!\n\nAnki қилдингизми? Неча карта? 🧠\n\nЖавобингизни ёзинг.`,
  11: (time) => `🏥 *${time}* — Универ/Кафедра!\n\nУниверситет ишларида нима қилдингиз? 📖\n\nЖавобингизни ёзинг.`,
  12: (time) => `🕌 *${time}* — Пешин!\n\nПешин намозини ўқидингизми? Тушликка чиқдингизми? 🍽️\n\nЖавобингизни ёзинг.`,
  13: (time) => `☀️ *${time}* — Тушдан кейинги фаза!\n\nКуннинг иккинчи ярми бошланди. Энергия борми? 💪\n\nЖавобингизни ёзинг.`,
  14: (time) => `📚 *${time}* — Ўқиш давом этади!\n\nНима ўқидингиз? UWorld ёки First Aid? 📝\n\nЖавобингизни ёзинг.`,
  15: (time) => `🕌 *${time}* — Аср!\n\nАср намозини ўқидингизми? Куннинг чарчоқи сезиляптими? 😌\n\nЖавобингизни ёзинг.`,
  16: (time) => `🇩🇪 *${time}* — Немецкий марафон!\n\nИккинчи немис сессиясини бошладингизми? 📺\n\nЖавобингизни ёзинг.`,
  17: (time) => `🤲 *${time}* — Ибодат паузаси!\n\nЗикр қилдингизми? Қуръон ўқидингизми? 📖\n\nЖавобингизни ёзинг.`,
  18: (time) => `🕌 *${time}* — Шом!\n\nШом намозини ўқидингизми? Оила билан вақт ўтказдингизми? 👨‍👩‍👦\n\nЖавобингизни ёзинг.`,
  19: (time) => `🌆 *${time}* — Кечқурун!\n\nКун режасининг неча фоизи бажарилди? 📋\n\nЖавобингизни ёзинг.`,
  20: (time) => `🕌 *${time}* — Хуфтон!\n\nХуфтон намозини ўқидингизми? Бу кунги энг катта ютуқ нима? 🌟\n\nЖавобингизни ёзинг.`,
  21: (time) => `🌙 *${time}* — Кун якуни!\n\nБугунги кунга 1-10 балл қўйинг ва нима учун? 🤔\n\nЖавобингизни ёзинг.`,
  22: (time) => `💤 *${time}* — Сўнгги текширув!\n\nУхлашдан олдин: эртага нима қиласиз? Режа тайёрми? 🛌\n\nЖавобингизни ёзинг.`
};

function scheduleHourlyQuestions(bot) {
  cron.schedule('0 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22 * * *', async () => {
    const hour = getTashkentHour();
    const time = getTashkentTime();

    const questionFn = HOURLY_QUESTIONS[hour];
    if (!questionFn) return;

    const question = questionFn(time);

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
