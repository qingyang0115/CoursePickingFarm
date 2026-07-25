const courseLine = (listing) =>
    `Course Code : ${listing.courseCode}\n` +
    `Available Slot : ${listing.currentSlot}\n` +
    `Desired Slot : ${listing.desiredSlot}\n` +
    `Comments : ${listing.comments || "None"}`;

// items: [{ listing, matchId, displayName }] — one entry per match found for this recipient.
function buildMatchNotification(items) {
    const multiple = items.length > 1;

    const header = multiple
        ? `We found ${items.length} matches for your course listings!\n\n`
        : "We found a match for your course listing!\n\n";

    const cards = items.map((item, i) => {
        const label = multiple ? `Match ${i + 1}\n` : "";
        return label + courseLine(item.listing) + `\nOther user : ${item.displayName}\n`;
    });

    const footer = multiple
        ? "\nTap a button below to respond to each match."
        : "\nTap Confirm to reveal contact details and arrange the swap, or Decline to pass.";

    const text = header + cards.join("\n") + footer;

    const rows = [];
    items.forEach((item, i) => {
        const prefix = multiple ? `Match ${i + 1}: ` : "";
        rows.push([
            { text: `${prefix}✅ Confirm`, callback_data: `confirm:${item.matchId}` },
            { text: `${prefix}❌ Decline`, callback_data: `decline:${item.matchId}` },
        ]);
        rows.push([
            { text: `${prefix}🚩 Report`, callback_data: `report:${item.matchId}` },
            { text: `${prefix}🚫 Block`, callback_data: `block:${item.matchId}` },
        ]);
    });

    return { text, keyboard: { reply_markup: { inline_keyboard: rows } } };
}

function confirmedMessage(otherListing, otherDisplayName) {
    return (
        "Both sides confirmed! Here's how to reach the other user:\n\n" +
        courseLine(otherListing) +
        `\nName : ${otherDisplayName}\n` +
        `Email : ${otherListing.createdByEmail || "Not provided"}\n\n` +
        "Please reach out to arrange the swap."
    );
}

function declinedMessage() {
    return "This match fell through — the other user declined. Your listing is back in the pool and can match with someone else.";
}

function expiredMessage() {
    return "This match expired after 24h without both sides confirming. Your listing is back in the pool and can match with someone else.";
}

module.exports = {
    buildMatchNotification,
    confirmedMessage,
    declinedMessage,
    expiredMessage,
};
