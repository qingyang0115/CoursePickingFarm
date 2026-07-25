const { bot } = require("./client");
const actions = require("./actions");

bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat?.id;
    const [action, matchId] = (query.data || "").split(":");

    try {
        let result;
        switch (action) {
            case "confirm":
                result = await actions.handleConfirm(matchId, chatId);
                break;
            case "decline":
                result = await actions.handleDecline(matchId, chatId);
                break;
            case "block":
                result = await actions.handleBlock(matchId, chatId);
                break;
            case "report":
                result = await actions.handleReport(matchId, chatId);
                break;
            default:
                result = { toast: "Unknown action." };
        }

        await bot.answerCallbackQuery(query.id, { text: result.toast });

        if (result.resolved && query.message) {
            await bot
                .editMessageReplyMarkup(
                    { inline_keyboard: [] },
                    { chat_id: query.message.chat.id, message_id: query.message.message_id }
                )
                .catch(() => {});
        }
    } catch (error) {
        console.error("callback_query handler error:", error);
        await bot.answerCallbackQuery(query.id, { text: "Something went wrong, please try again." }).catch(() => {});
    }
});

async function runSlashAction(msg, handler, noMatchText) {
    const chatId = msg.chat.id;
    try {
        const match = await actions.findMostRecentMatchForChat(chatId);
        if (!match) {
            await bot.sendMessage(chatId, noMatchText);
            return;
        }
        const result = await handler(match._id, chatId);
        await bot.sendMessage(chatId, result.toast);
    } catch (error) {
        console.error("Slash command handler error:", error);
        await bot.sendMessage(chatId, "Something went wrong, please try again.").catch(() => {});
    }
}

bot.onText(/^\/report/, (msg) =>
    runSlashAction(
        msg,
        actions.handleReport,
        "You don't have any recent matches to report. Use the 🚩 Report button on a match notification instead."
    )
);

bot.onText(/^\/block/, (msg) =>
    runSlashAction(
        msg,
        actions.handleBlock,
        "You don't have any recent matches to block. Use the 🚫 Block button on a match notification instead."
    )
);

module.exports = { bot };
