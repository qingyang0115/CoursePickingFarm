const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = TelegramBotModule.default || TelegramBotModule;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function notifyMatch(listingA, listingB) {
    //send the msg of the information of the other listing to each user
    const msg = (other) => 
        'We found a match for your course listing!\n\n' +
        `Course Code : ${other.courseCode}\n` +
        'Available Slot : ' + other.currentSlot + '\n' +
        'Desired Slot : ' + other.desiredSlot + '\n' +
        'Comments : ' + (other.comments || 'None') + '\n\n' +
        'Please contact the other user to arrange the swap.\n' +
        'Telegram Handle : ' + (other.telegramHandle || 'Not provided') + '\n' +
        'Email : ' + other.createdByEmail + '\n\n'
    if (listingA.telegramHandle) {
        await bot.sendMessage(listingA.telegramHandle, msg(listingB));
    }
    if (listingB.telegramHandle) {
        await bot.sendMessage(listingB.telegramHandle, msg(listingA));
    }
}

module.exports = {
    notifyMatch,
};