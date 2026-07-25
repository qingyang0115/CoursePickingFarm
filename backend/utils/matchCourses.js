const CourseListing = require("../models/CourseListing");
const Block = require("../models/Block");

// Listings created before the `status` field existed have no value set;
// treat those as active too so nothing gets silently excluded from matching.
const ACTIVE_FILTER = { $or: [{ status: "active" }, { status: { $exists: false } }] };

const findAllMatches = async (listing) => {
    try {
        const candidates = await CourseListing.find({
            ...ACTIVE_FILTER,
            courseCode: listing.courseCode,
            currentSlot: listing.desiredSlot,
            desiredSlot: listing.currentSlot,
            createdBy: { $ne: listing.createdBy },
        });

        if (candidates.length === 0) {
            return [];
        }

        const blocks = await Block.find({
            $or: [
                { blockerUid: listing.createdBy },
                { blockedUid: listing.createdBy },
            ],
        });

        const blockedUids = new Set();
        for (const block of blocks) {
            if (block.blockerUid === listing.createdBy) blockedUids.add(block.blockedUid);
            if (block.blockedUid === listing.createdBy) blockedUids.add(block.blockerUid);
        }

        return candidates.filter((candidate) => !blockedUids.has(candidate.createdBy));
    } catch (error) {
        console.error("Match error:", error);
        return [];
    }
};

module.exports = { findAllMatches, ACTIVE_FILTER };
