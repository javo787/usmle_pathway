const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');
const { getTimeLeft } = require('../utils/dates');
const { CONFIG } = require('../config');
const UserProfile = require('../models/UserProfile');

function setupCallbackHandler(bot) {
  bot.on('callback_query', async (query) => {
    const tgId = query.from.id.toString();
    const masterEmail = getMasterEmail(tgId, CONFIG.userMap);
    if (!masterEmail) return;

    const data = query.data;

    // --- Намоз таймер: prayer_yes_<название> / prayer_no_<название> ---
    if (data.startsWith('prayer_')) {
      const [, subtype, prayerName] = data.split('_');
      const log = await getOrCreateLog(masterEmail);

      if (subtype === 'yes') {
        const current = log.spiritual.prayersDone || 0;
        if (current < 5) {
          log.spiritual.prayersDone = current + 1;
          await log.save();
          await bot.answerCallbackQuery(query.id, { text: `✅ ${prayerName} қабул бўлсин!` });
          await bot.editMessageText(
            `🕌 *${prayerName} — Аллоҳ қабул қилсин!* (${current + 1}/5)`,
            {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              parse_mode: 'Markdown'
            }
          );
        } else {
          await bot.answerCallbackQuery(query.id, { text: 'Бугун 5 вақт тўлди.' });
        }
      } else if (subtype === 'no') {
        await bot.answerCallbackQuery(query.id, { text: 'Кейинги намозни кутиб қолманг.' });
        await bot.editMessageText(
          `⚠️ *${prayerName} ўқилмади.* Асосийси кейингисида тузатиш.`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
    }

    // --- Ядерный таймер: debt_refresh ---
    else if (data === 'debt_refresh') {
      const log = await getOrCreateLog(masterEmail);
      const debt = log.penaltyDebt || 0;

      if (!debt || !log.debtCreatedAt) {
        await bot.answerCallbackQuery(query.id, { text: 'Қарз мавжуд эмас.' });
        return;
      }

      const timeLeft = getTimeLeft(log.debtCreatedAt);
      const urgency = timeLeft.expired
        ? '\n🚨 *ВАҚТ ТУГАДИ!* Ядерний зарба берилди!'
        : timeLeft.hours < 4 ? '\n⚠️ *СЎНГГИ СОАТЛАР!*' : timeLeft.hours < 8 ? '\n⏳ Вақт оз қолди...' : '';

      const newText =
        `💰 *Қарз ҳолати:*\n\n` +
        `Миқдор: *${debt} сомони*\n` +
        `Қолди: ⏳ *${timeLeft.text}*${urgency}\n\n` +
        `_Таймерни янгилаш учун тугмани босинг._`;

      const keyboard = {
        inline_keyboard: [[
          { text: '🔄 Обновить', callback_data: 'debt_refresh' }
        ]]
      };

      try {
        await bot.editMessageText(newText, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        await bot.answerCallbackQuery(query.id);
      } catch (e) {
        console.error('debt_refresh edit error:', e.message);
        await bot.answerCallbackQuery(query.id, { text: 'Янгиланиб бўлмади.' });
      }
    }

      // --- Антирелапс: anti_safe_read, anti_safe_sleep, anti_danger ---
else if (data.startsWith('anti_')) {
  const subtype = data.replace('anti_', '');

  if (subtype === 'safe_read' || subtype === 'safe_sleep') {
    await bot.answerCallbackQuery(query.id, { text: 'Барака топинг! Ўзингизни асранг.' });
    await bot.editMessageText(
      `✅ *Яхши танлов!*\n` +
      `Бу соатларни фойдали ўтказиш — катта ютуқ. Давом этинг.`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'Markdown'
      }
    );
  } else if (subtype === 'danger') {
    await bot.answerCallbackQuery(query.id, { text: 'Тўхтанг, бу йўл яхши эмас.' });
    const advice =
      `💪 *ТЎХТАНГ!*\n\n` +
      `Ҳозир дарҳол:\n` +
      `1. Телефонни ёнга қўйинг\n` +
      `2. Таҳорат олинг\n` +
      `3. 2 ракаат намоз ўқинг\n` +
      `4. Ётиб ухланг\n\n` +
      `_Нейрохирург бўлиш учун мия тиниқлиги керак._\n` +
      `_Бу йўлни тарк этинг._`;
    await bot.editMessageText(advice, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
    });
  }
}

  // --- Умный будильник: wakeup_<время> ---
else if (data.startsWith('wakeup_')) {
  const time = data.replace('wakeup_', '');
  try {
    await UserProfile.updateOne(
      { masterEmail },
      { $set: { wakeUpTime: time } }
    );
    await bot.answerCallbackQuery(query.id, { text: `✅ Уйғониш вақти ${time} қилиб белгиланди.` });
    await bot.editMessageText(
      `⏰ *Янги ҳафта учун уйғониш вақти: ${time}*\nЭртага шу вақтда хабар юбораман.`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'Markdown'
      }
    );
  } catch (e) {
    console.error('wakeup update error:', e.message);
    await bot.answerCallbackQuery(query.id, { text: 'Хатолик юз берди.' });
  }
}

    // Неизвестный callback
    else {
      await bot.answerCallbackQuery(query.id, { text: 'Номаълум буйруқ.' });
    }
  });
}

module.exports = setupCallbackHandler;
