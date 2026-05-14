// utils/telegram.js — FIXED VERSION
const { CONFIG } = require('../config');

/**
 * Escape only symbols that break Markdown v1 in Telegram
 */
function escapeMarkdown(text) {
  return String(text || '').replace(/[_*`\[]/g, '\\$&');
}

/**
 * Splits text into chunks that fit within maxLen characters.
 * Tries to split on newlines first, falls back to character splits.
 * FIXED: properly handles lines longer than maxLen.
 */
function splitIntoChunks(text, maxLen = 4096) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    // If a single line exceeds maxLen, break it by characters
    if (line.length > maxLen) {
      // First flush whatever we have in current
      if (current.trim()) {
        chunks.push(current.trim());
        current = '';
      }
      // Break the long line into pieces
      for (let i = 0; i < line.length; i += maxLen) {
        chunks.push(line.slice(i, i + maxLen));
      }
      continue;
    }

    // Would adding this line exceed maxLen?
    const candidate = current ? current + '\n' + line : line;

    if (candidate.length > maxLen) {
      // Flush current, start fresh with this line
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length ? chunks : [text];
}

/**
 * Helper delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a single chunk — tries Markdown first, then plain text
 */
async function sendChunk(bot, chatId, text, options = {}) {
  // Try Markdown
  try {
    return await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
  } catch (markdownErr) {
    // Try plain text
    try {
      const plainOptions = { ...options };
      delete plainOptions.parse_mode;
      return await bot.sendMessage(chatId, text, plainOptions);
    } catch (plainErr) {
      console.error(`[safeSend] Failed to send message to ${chatId}:`, plainErr.message);
      console.error(`[safeSend] Message length was: ${text.length} chars`);
      return null;
    }
  }
}

/**
 * Reliably sends a message, splitting if needed.
 * 1. Split text into ≤4096 char chunks
 * 2. Try Markdown for each chunk
 * 3. Fall back to plain text if Markdown fails
 */
const safeSend = async (bot, chatId, text, options = {}) => {
  if (!text || !String(text).trim()) return null;

  const MAX_LENGTH = 4000; // Use 4000 instead of 4096 for safety margin
  const str = String(text);

  const chunks = splitIntoChunks(str, MAX_LENGTH);

  // Log if we're splitting (useful for Vercel debugging)
  if (chunks.length > 1) {
    console.log(`[safeSend] Splitting message into ${chunks.length} chunks (total: ${str.length} chars)`);
  }

  let lastResult = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    lastResult = await sendChunk(bot, chatId, chunk, i === 0 ? options : {});
    if (chunks.length > 1 && i < chunks.length - 1) {
      await delay(300);
    }
  }

  return lastResult;
};

/**
 * Returns masterEmail by Telegram ID
 */
const getMasterEmail = (tgId, userMap) => {
  return userMap[String(tgId)] || null;
};

/**
 * Check if user is allowed
 */
const isAllowed = (tgId, userMap) => {
  return !!getMasterEmail(tgId, userMap);
};

/**
 * Main bot keyboard
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
  splitIntoChunks, // exported for testing
};
