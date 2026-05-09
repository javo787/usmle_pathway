const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  userMap: {
    [process.env.TELEGRAM_USER_ID]: 'javo.nur.2004@gmail.com',
    '8383611951': 'javo.nur.2004@gmail.com',
    '5909296696': 'javo.nur.2004@gmail.com',
  },
  mongoUri: process.env.MONGODB_URI,
  geminiKey: process.env.GEMINI_API_KEY,
  apiId: parseInt(process.env.TELEGRAM_API_ID || "0"),
  apiHash: process.env.TELEGRAM_API_HASH,
  userbotSession: process.env.USERBOT_SESSION,
  nukeContacts: (process.env.NUKE_CONTACTS || "").split(',').filter(Boolean),
  timezone: "Asia/Tashkent",
};

const ALLOWED_TG_IDS = Object.keys(CONFIG.userMap).filter(Boolean);

module.exports = { CONFIG, ALLOWED_TG_IDS };
