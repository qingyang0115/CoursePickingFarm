const mongoose = require("mongoose");
const courseListingSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: true,
        },
        currentSlot: {
            type: String,
            required: true,
        },
        desiredSlot: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model("CourseListing", courseListingSchema);