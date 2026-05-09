const safeSend = async (bot, chatId, text, options = {}) => {
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
  } catch (err) {
    console.error(`Send error to ${chatId}:`, err.message);
    return null;
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


// utils/telegram.js
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

module.exports = { safeSend, getMasterEmail, isAllowed, mainKeyboard, escapeMarkdown };
