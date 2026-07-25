const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
    {
        blockerUid: {
            type: String,
            required: true,
        },
        blockedUid: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

blockSchema.index({ blockerUid: 1, blockedUid: 1 }, { unique: true });

module.exports = mongoose.model("Block", blockSchema);
