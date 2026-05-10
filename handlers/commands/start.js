// handlers/commands/start.js
const { safeSend, isAllowed, mainKeyboard } = require('../../utils/telegram'); // ← добавить mainKeyboard
const { CONFIG } = require('../../config');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return safeSend(bot, tgId, '⛔ Кечирасиз, бу шахсий бот.');
    const name = msg.from.first_name || 'Доктор';
    await safeSend(bot, tgId,
      `🏥 *Medical Brother v6.0*\n\nХуш келибсиз, *${name}!* 👋`,
      mainKeyboard  // ← правильная передача
    );
  });
};
