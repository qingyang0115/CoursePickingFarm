const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
    {
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SwapMatch",
        },
        chatId: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["match_found", "confirmed", "declined", "expired", "report_ack"],
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "failed"],
            required: true,
        },
        error: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
