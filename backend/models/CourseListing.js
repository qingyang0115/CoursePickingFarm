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
        comments: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: String,
            required: true,
        },
        createdByEmail: {
            type: String,
        },
        telegramHandle: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "pending", "confirmed"],
            default: "active",
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model("CourseListing", courseListingSchema);
