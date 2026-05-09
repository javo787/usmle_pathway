const { CONFIG } = require('../config');

function escapeMarkdown(text) {
  return String(text || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

const safeSend = async (bot, chatId, text, options = {}) => {
  // Пробуем с Markdown
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
  } catch (err) {
    // Markdown сломался – шлём как обычный текст
    try {
      const plainOptions = { ...options };
      delete plainOptions.parse_mode; // убираем parse_mode
      return await bot.sendMessage(chatId, text, plainOptions);
    } catch (err2) {
      console.error(`Send error to ${chatId}:`, err2.message);
      return null;
    }
  }
};

const getMasterEmail = (tgId, userMap) => userMap[tgId.toString()] || null;
const isAllowed = (tgId, userMap) => !!getMasterEmail(tgId, userMap);

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['📊 Статус', '📝 Жавоблар'],
      ['🤲 Намоз +1', '💀 Срыв'],
      ['💰 Қарз', '🧠 AI Таҳлил'],
      ['🏆 Стрик', '❓ Ёрдам']
    ],
    resize_keyboard: true
  }
};

module.exports = { safeSend, getMasterEmail, isAllowed, mainKeyboard, escapeMarkdown };
