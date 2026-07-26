const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
        },
        name: {
            type: String,
            trim: true,
            default: "",
        },
        age: {
            type: Number,
            min: 0,
            max: 120,
        },
        sex: {
            type: String,
            trim: true,
            enum: ["M", "F", ""],
            default: "",
        },
        major: {
            type: String,
            trim: true,
            default: "",
        },
        telegramHandle: {
            type: String,
            trim: true,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);