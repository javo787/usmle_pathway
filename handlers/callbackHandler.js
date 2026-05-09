const { safeSend, getMasterEmail } = require('../utils/telegram');
const { getOrCreateLog } = require('../utils/dbHelpers');
const { getTimeLeft } = require('../utils/dates');
const { CONFIG } = require('../config');

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

    // Неизвестный callback
    else {
      await bot.answerCallbackQuery(query.id, { text: 'Номаълум буйруқ.' });
    }
  });
}

module.exports = setupCallbackHandler;
