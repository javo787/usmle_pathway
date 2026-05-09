const axios = require('axios');
const { CONFIG } = require('../config');
const { safeSend, isAllowed } = require('../utils/telegram');
const splitMessage = require('../utils/splitMessage');

function setupVoiceHandler(bot, { model }) {
  bot.on('voice', async (msg) => {
    const tgId = msg.from.id.toString();
    if (!isAllowed(tgId, CONFIG.userMap)) return;

    const loading = await bot.sendMessage(tgId, '🎙️ Овоз таҳлил қилинмоқда...');
    try {
      const fileLink = await bot.getFileLink(msg.voice.file_id);
      const { data } = await axios.get(fileLink, { responseType: 'arraybuffer' });
      const base64Audio = Buffer.from(data).toString('base64');

      const result = await model.generateContent([
        `Сен Жавоҳирнинг қаттиққўл лекин меҳрибон AI-акасисан. У нейрохирург бўлишни мақсад қилган.\nДангасалик бўлса — қаттиқ айт. Чарчаса — мотивация бер. Савол бўлса — аниқ жавоб. Ўзбек Кирилл, қисқа.`,
        { inlineData: { mimeType: 'audio/ogg', data: base64Audio } }
      ]);

      const voiceReply = `🎙️ *AI жавоби:*\n\n${result.response.text()}`;
      const voiceParts = splitMessage(voiceReply);
      await bot.editMessageText(voiceParts[0], {
        chat_id: msg.chat.id, message_id: loading.message_id, parse_mode: 'Markdown'
      });
      for (let i = 1; i < voiceParts.length; i++) {
        await safeSend(bot, msg.chat.id, voiceParts[i]);
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      await bot.editMessageText('⚠️ Овозни таниб бўлмади.', { chat_id: msg.chat.id, message_id: loading.message_id });
    }
  });
}

module.exports = setupVoiceHandler;
