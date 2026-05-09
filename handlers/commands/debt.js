const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');
const { getTimeLeft } = require('../../utils/dates');

module.exports = (bot) => {
  bot.onText(/💰 Қарз/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;
    const log = await getOrCreateLog(getMasterEmail(tgId, CONFIG.userMap));
    const debt = log.penaltyDebt || 0;

    if (!debt) {
      return safeSend(bot, tgId, '✅ *Қарз йўқ!* Давом эт, доктор! 💪');
    }

    if (!log.debtCreatedAt) {
      return safeSend(bot, tgId, `💰 Жорий қарз: *${debt} сомони* (таймер топилмади)`);
    }

    const timeLeft = getTimeLeft(log.debtCreatedAt);
    const urgency = timeLeft.expired
      ? '\n🚨 *ВАҚТ ТУГАДИ!* Ядерний зарба берилди!'
      : timeLeft.hours < 4 ? '\n⚠️ *СЎНГГИ СОАТЛАР!*' : timeLeft.hours < 8 ? '\n⏳ Вақт оз қолди...' : '';

    const message =
      `💰 *Қарз ҳолати:*\n\n` +
      `Миқдор: *${debt} сомони*\n` +
      `Қолди: ⏳ *${timeLeft.text}*${urgency}\n\n` +
      `_Таймерни янгилаш учун тугмани босинг._`;

    const keyboard = {
      inline_keyboard: [[
        { text: '🔄 Обновить', callback_data: 'debt_refresh' }
      ]]
    };

    await safeSend(bot, tgId, message, { reply_markup: keyboard });
  });
};
