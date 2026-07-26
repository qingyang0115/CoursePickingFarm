const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
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

module.exports = mongoose.model("Item", itemSchema);