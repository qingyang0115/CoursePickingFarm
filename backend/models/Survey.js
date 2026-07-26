const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        remuneration: {
            type: String,
            required: true,
            trim: true,
        },
        telegramHandle: {
            type: String,
            required: true,
            trim: true,
        },
        minAge: {
            type: Number,
        },
        maxAge: {
            type: Number,
        },
        sex: {
            type: String,
            enum: ["", "M", "F"],
            default: "",
        },
        major: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: String,
            required: true,
        },
        createdByEmail: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Survey", surveySchema);