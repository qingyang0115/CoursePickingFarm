const { bot } = require("./client");
const NotificationLog = require("../models/NotificationLog");
const {
    buildMatchNotification,
    confirmedMessage,
    declinedMessage,
    expiredMessage,
} = require("./messages");

// Batch near-simultaneous matches for the same recipient into a single message
// instead of spamming one message per match.
const BATCH_WINDOW_MS = 10 * 1000;
const pendingByChat = new Map(); // chatId -> { items: [...], timer }

async function getDisplayName(chatId) {
    try {
        const chat = await bot.getChat(chatId);
        if (chat.username) return `@${chat.username}`;
        if (chat.first_name) return chat.first_name;
        return "the other user";
    } catch (error) {
        console.error("getChat failed for", chatId, error.message);
        return "the other user";
    }
}

async function logAttempt({ matchIds, chatId, type, status, error }) {
    const ids = matchIds && matchIds.length > 0 ? matchIds : [undefined];
    await Promise.all(
        ids.map((matchId) =>
            NotificationLog.create({
                matchId,
                chatId: String(chatId),
                type,
                status,
                error,
            }).catch((logError) => console.error("Failed to write NotificationLog:", logError.message))
        )
    );
}

async function sendAndLog({ chatId, type, text, keyboard, matchIds }) {
    if (!chatId) return;
    try {
        await bot.sendMessage(chatId, text, keyboard);
        await logAttempt({ matchIds, chatId, type, status: "sent" });
    } catch (error) {
        console.error(`Telegram send failed (${type}) to ${chatId}:`, error.message);
        await logAttempt({ matchIds, chatId, type, status: "failed", error: error.message });
    }
}

async function flushChat(chatId) {
    const entry = pendingByChat.get(chatId);
    if (!entry) return;
    pendingByChat.delete(chatId);

    const items = [];
    for (const job of entry.items) {
        const displayName = await getDisplayName(job.otherChatId);
        items.push({ listing: job.otherListing, matchId: job.matchId, displayName });
    }

    const { text, keyboard } = buildMatchNotification(items);
    await sendAndLog({
        chatId,
        type: "match_found",
        text,
        keyboard,
        matchIds: items.map((item) => item.matchId),
    });
}

// Call once per (recipient, match) pair — batches automatically.
function queueMatchNotification(matchId, recipientChatId, otherListing, otherChatId) {
    if (!recipientChatId) return;

    let entry = pendingByChat.get(recipientChatId);
    if (!entry) {
        entry = { items: [], timer: null };
        pendingByChat.set(recipientChatId, entry);
    }
    entry.items.push({ matchId, otherListing, otherChatId });

    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
        flushChat(recipientChatId).catch((error) =>
            console.error("Failed to flush batched notifications:", error)
        );
    }, BATCH_WINDOW_MS);
}

async function notifyConfirmed(chatId, otherListing, otherChatId, matchId) {
    const displayName = await getDisplayName(otherChatId);
    await sendAndLog({
        chatId,
        type: "confirmed",
        text: confirmedMessage(otherListing, displayName),
        matchIds: [matchId],
    });
}

async function notifyDeclined(chatId, matchId) {
    await sendAndLog({ chatId, type: "declined", text: declinedMessage(), matchIds: [matchId] });
}

async function notifyExpired(chatId, matchId) {
    await sendAndLog({ chatId, type: "expired", text: expiredMessage(), matchIds: [matchId] });
}

module.exports = {
    queueMatchNotification,
    notifyConfirmed,
    notifyDeclined,
    notifyExpired,
};
