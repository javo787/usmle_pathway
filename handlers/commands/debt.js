const { safeSend, isAllowed, getMasterEmail } = require('../../utils/telegram');
const { CONFIG } = require('../../config');
const { getOrCreateLog } = require('../../utils/dbHelpers');

function getTimeLeft(createdAt) {
  const now = new Date();
  const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline - now;
  if (diff <= 0) return { expired: true, text: '0 соат 0 дақиқа' };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return {
    expired: false,
    hours,
    minutes,
    text: `${hours} соат ${minutes} дақиқа`,
  };
}

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
