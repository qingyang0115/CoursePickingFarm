const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporterUid: {
            type: String,
            required: true,
        },
        reportedUid: {
            type: String,
            required: true,
        },
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SwapMatch",
        },
        reason: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
