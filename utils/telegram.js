const { CONFIG } = require('../config');

/**
 * Экранирует только символы которые ломают Markdown v1 в Telegram
 */
function escapeMarkdown(text) {
  return String(text || '').replace(/[_*`\[]/g, '\\$&');
}

/**
 * Надёжная отправка сообщения:
 * 1. Пробуем с Markdown
 * 2. Если не вышло — plain text
 * 3. Если текст слишком длинный — разбиваем и шлём по частям
 */
const safeSend = async (bot, chatId, text, options = {}) => {
  if (!text || !String(text).trim()) return null;

  const MAX_LENGTH = 4096;
  const chunks = splitIntoChunks(String(text), MAX_LENGTH);
  let lastResult = null;

  for (const chunk of chunks) {
    lastResult = await sendChunk(bot, chatId, chunk, options);
    if (chunks.length > 1) {
      await delay(300);
    }
  }

  return lastResult;
};

async function sendChunk(bot, chatId, text, options = {}) {
  // Попытка 1: Markdown
  try {
    return await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
  } catch (markdownErr) {
    // Попытка 2: Plain text (без parse_mode)
    try {
      const plainOptions = { ...options };
      delete plainOptions.parse_mode;
      return await bot.sendMessage(chatId, text, plainOptions);
    } catch (plainErr) {
      console.error(`[safeSend] Не удалось отправить сообщение в ${chatId}:`, plainErr.message);
      return null;
    }
  }
}

/**
 * Разбивает длинный текст на куски не разрывая слова и строки
 */
function splitIntoChunks(text, maxLen) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    // Если одна строка длиннее maxLen — режем по символам
    if (line.length > maxLen) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      for (let i = 0; i < line.length; i += maxLen) {
        chunks.push(line.slice(i, i + maxLen));
      }
      continue;
    }

    const candidate = current ? current + '\n' + line : line;
    if (candidate.length > maxLen) {
      chunks.push(current.trim());
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Задержка в мс
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Возвращает masterEmail по Telegram ID
 */
const getMasterEmail = (tgId, userMap) => {
  return userMap[String(tgId)] || null;
};

/**
 * Проверяет разрешён ли пользователь
 */
const isAllowed = (tgId, userMap) => {
  return !!getMasterEmail(tgId, userMap);
};

/**
 * Главная клавиатура бота
 */
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['📊 Статус',   '📝 Жавоблар' ],
      ['🤲 Намоз +1', '💀 Срыв'     ],
      ['💰 Қарз',     '🧠 AI Таҳлил'],
      ['🏆 Стрик',    '❓ Ёрдам'    ],
    ],
    resize_keyboard: true,
  },
};

module.exports = {
  safeSend,
  getMasterEmail,
  isAllowed,
  mainKeyboard,
  escapeMarkdown,
};
