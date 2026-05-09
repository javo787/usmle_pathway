const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

async function initUserbot(apiId, apiHash, session) {
  if (!apiId || !apiHash || !session) {
    console.log("⚠️ Юзербот не настроен");
    return null;
  }
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  console.log("☢️ Юзербот (Ядерный протокол) активен");
  return client;
}

async function sendNukeMessages(userbot, contacts, message) {
  for (const contact of contacts) {
    try { await userbot.sendMessage(contact, { message }); } catch (e) { console.error("Nuke:", e.message); }
  }
}

module.exports = { initUserbot, sendNukeMessages };
