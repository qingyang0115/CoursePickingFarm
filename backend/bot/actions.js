const SwapMatch = require("../models/SwapMatch");
const CourseListing = require("../models/CourseListing");
const Block = require("../models/Block");
const Report = require("../models/Report");
const { notifyConfirmed, notifyDeclined } = require("./notify");

async function loadMatch(matchId) {
    if (!matchId) return null;
    try {
        return await SwapMatch.findById(matchId).populate("listingA").populate("listingB");
    } catch (error) {
        return null;
    }
}

function sideFor(match, chatId) {
    if (String(match.listingA.telegramHandle) === String(chatId)) return "A";
    if (String(match.listingB.telegramHandle) === String(chatId)) return "B";
    return null;
}

function otherOf(match, side) {
    return side === "A" ? match.listingB : match.listingA;
}

async function releaseListings(match) {
    await CourseListing.updateMany(
        { _id: { $in: [match.listingA._id, match.listingB._id] } },
        { $set: { status: "active" } }
    );
}

async function handleConfirm(matchId, chatId) {
    const match = await loadMatch(matchId);
    if (!match) return { toast: "This match no longer exists." };
    if (match.status !== "pending") return { toast: "This match is no longer active." };

    const side = sideFor(match, chatId);
    if (!side) return { toast: "This match doesn't belong to you." };

    if (side === "A") match.responseA = "confirmed";
    else match.responseB = "confirmed";
    await match.save();

    const bothConfirmed = match.responseA === "confirmed" && match.responseB === "confirmed";
    if (!bothConfirmed) {
        return { toast: "Confirmed — waiting on the other user.", resolved: false };
    }

    match.status = "confirmed";
    match.resolvedAt = new Date();
    await match.save();
    await CourseListing.updateMany(
        { _id: { $in: [match.listingA._id, match.listingB._id] } },
        { $set: { status: "confirmed" } }
    );

    await notifyConfirmed(match.listingA.telegramHandle, match.listingB, match.listingB.telegramHandle, match._id);
    await notifyConfirmed(match.listingB.telegramHandle, match.listingA, match.listingA.telegramHandle, match._id);

    return { toast: "Confirmed! Contact details sent to both of you.", resolved: true };
}

async function handleDecline(matchId, chatId) {
    const match = await loadMatch(matchId);
    if (!match) return { toast: "This match no longer exists." };
    if (match.status !== "pending") return { toast: "This match is no longer active." };

    const side = sideFor(match, chatId);
    if (!side) return { toast: "This match doesn't belong to you." };

    if (side === "A") match.responseA = "declined";
    else match.responseB = "declined";
    match.status = "declined";
    match.resolvedAt = new Date();
    await match.save();
    await releaseListings(match);

    const other = otherOf(match, side);
    await notifyDeclined(other.telegramHandle, match._id);

    return { toast: "Declined. The listing is back in the pool.", resolved: true };
}

async function handleBlock(matchId, chatId) {
    const match = await loadMatch(matchId);
    if (!match) return { toast: "This match no longer exists." };

    const side = sideFor(match, chatId);
    if (!side) return { toast: "This match doesn't belong to you." };

    const self = side === "A" ? match.listingA : match.listingB;
    const other = otherOf(match, side);

    await Block.updateOne(
        { blockerUid: self.createdBy, blockedUid: other.createdBy },
        { $setOnInsert: { blockerUid: self.createdBy, blockedUid: other.createdBy } },
        { upsert: true }
    );

    let resolved = false;
    if (match.status === "pending") {
        match.status = "declined";
        match.resolvedAt = new Date();
        await match.save();
        await releaseListings(match);
        // Generic decline wording — don't tell the other party they were blocked.
        await notifyDeclined(other.telegramHandle, match._id);
        resolved = true;
    }

    return { toast: "Blocked. You won't be matched with this user again.", resolved };
}

async function handleReport(matchId, chatId, reason) {
    const match = await loadMatch(matchId);
    if (!match) return { toast: "This match no longer exists." };

    const side = sideFor(match, chatId);
    if (!side) return { toast: "This match doesn't belong to you." };

    const self = side === "A" ? match.listingA : match.listingB;
    const other = otherOf(match, side);

    const report = await Report.create({
        reporterUid: self.createdBy,
        reportedUid: other.createdBy,
        matchId: match._id,
        reason,
    });
    console.error("[REPORT]", {
        reportId: String(report._id),
        reporterUid: self.createdBy,
        reportedUid: other.createdBy,
        matchId: String(match._id),
        reason: reason || null,
    });

    return { toast: "Thanks, we've logged your report." };
}

async function findMostRecentMatchForChat(chatId) {
    const listings = await CourseListing.find({ telegramHandle: String(chatId) }).select("_id");
    const listingIds = listings.map((listing) => listing._id);
    if (listingIds.length === 0) return null;

    return SwapMatch.findOne({
        $or: [{ listingA: { $in: listingIds } }, { listingB: { $in: listingIds } }],
    }).sort({ createdAt: -1 });
}

module.exports = {
    handleConfirm,
    handleDecline,
    handleBlock,
    handleReport,
    findMostRecentMatchForChat,
};
