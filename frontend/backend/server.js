require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const CourseListing = require("./models/CourseListing");

const app = express();
const PORT = 5050;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running");
});

//let listings = []

app.get("/api/courseListings", async (req, res) => {
    try {
        const listings = await CourseListing.find().sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch listings" });
    }
});

app.post("/api/courseListings", async (req,res) => {
    try {
        const { courseCode, currentSlot, desiredSlot } = req.body;

        const newListing = new CourseListing({
            courseCode,
            currentSlot,
            desiredSlot,
        });

        const savedListing = await newListing.save();
        res.status(201).json(savedListing);
    } catch (error) {
        res.status(500).json({ error: "Failed to create listing" });
    }
});
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });




