const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // терминалдан маълумот ўқиш учун

const apiId = 35694549; 
const apiHash = "22549d323b5d9301690834d989f9626e"; 

const stringSession = new StringSession("");

(async () => {
  console.log("Телеграм аккаунтга уланиш бошланди...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  
  await client.start({
    phoneNumber: async () => await input.text("Телефон рақамингизни киритинг (масалан: +992... ёки +998...): "),
    password: async () => await input.text("Икки босқичли парол (2FA) бўлса киритинг (йўқ бўлса Enter босинг): "),
    phoneCode: async () => await input.text("Телеграмга келган 5 хонали кодни киритинг: "),
    onError: (err) => console.log(err),
  });
  
  console.log("\n✅ Муваффақиятли уланди!");
  console.log("ПАСТДАГИ УЗУН КОДНИ НУСХАЛАБ ОЛИНГ ВА .env.local ФАЙЛИГА USERBOT_SESSION СИФАТИДА ЖОЙЛАНГ:\n");
  console.log(client.session.save());
  process.exit(0);
})();