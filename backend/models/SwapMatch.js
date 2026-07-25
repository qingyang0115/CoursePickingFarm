const mongoose = require("mongoose");

const swapMatchSchema = new mongoose.Schema(
    {
        listingA: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CourseListing",
            required: true,
        },
        listingB: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CourseListing",
            required: true,
        },
        responseA: {
            type: String,
            enum: ["pending", "confirmed", "declined"],
            default: "pending",
        },
        responseB: {
            type: String,
            enum: ["pending", "confirmed", "declined"],
            default: "pending",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "declined", "expired"],
            default: "pending",
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        resolvedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SwapMatch", swapMatchSchema);
