const registerCommands = (bot, { callGemini }) => {
  require('./start')(bot);
  require('./status')(bot);
  require('./responses')(bot);
  require('./prayer')(bot);
  require('./penalty')(bot);
  require('./debt')(bot);
  require('./aiAnalysis')(bot, { callGemini });
  require('./streak')(bot);
  require('./help')(bot);
};

module.exports = registerCommands;
