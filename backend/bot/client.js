const TelegramBotModule = require("node-telegram-bot-api");
const TelegramBot = TelegramBotModule.default || TelegramBotModule;

// Polling (not a webhook) so the bot can receive button taps and commands
// without needing a public HTTPS deployment target.
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("polling_error", (error) => {
    console.error("Telegram polling error:", error.message);
});

module.exports = { bot };
