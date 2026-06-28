const CourseListing = require("../models/CourseListing");

const findMatch = async (listing) => {
    try {
        const match = await CourseListing.findOne({
            courseCode: listing.courseCode,
            currentSlot: listing.desiredSlot,
            desiredSlot: listing.currentSlot,
        });

        return match;
    } catch (error) {
        console.error("Match error:", error);
        return null;
    }
};

module.exports = { findMatch };