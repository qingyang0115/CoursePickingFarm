const SwapMatch = require("../models/SwapMatch");
const CourseListing = require("../models/CourseListing");
const { notifyExpired } = require("../bot/notify");

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

async function expireStaleMatches() {
    const staleMatches = await SwapMatch.find({
        status: "pending",
        expiresAt: { $lt: new Date() },
    })
        .populate("listingA")
        .populate("listingB");

    for (const match of staleMatches) {
        try {
            match.status = "expired";
            match.resolvedAt = new Date();
            await match.save();

            await CourseListing.updateMany(
                { _id: { $in: [match.listingA._id, match.listingB._id] } },
                { $set: { status: "active" } }
            );

            // Only notify the side(s) who were left waiting; a side that never
            // responded doesn't need to be told their own inaction expired the match.
            const notifyTargets = [];
            if (match.responseA === "confirmed") notifyTargets.push(match.listingA.telegramHandle);
            if (match.responseB === "confirmed") notifyTargets.push(match.listingB.telegramHandle);
            if (notifyTargets.length === 0) {
                notifyTargets.push(match.listingA.telegramHandle, match.listingB.telegramHandle);
            }

            for (const chatId of notifyTargets) {
                await notifyExpired(chatId, match._id);
            }
        } catch (error) {
            console.error("Failed to expire match", match._id, error);
        }
    }
}

function startExpiryJob() {
    setInterval(() => {
        expireStaleMatches().catch((error) => console.error("Expiry sweep failed:", error));
    }, SWEEP_INTERVAL_MS);
    console.log("Match expiry sweep started (every", SWEEP_INTERVAL_MS / 60000, "min)");
}

module.exports = { startExpiryJob, expireStaleMatches };
