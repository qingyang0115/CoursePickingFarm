require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const CourseListing = require("./models/CourseListing");
const { notifyMatch } = require("./telegramBot");
const app = express();
const PORT = 5050;
app.use(cors());
app.use(express.json());

const hasFirebaseAdminEnv =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

const getFirebasePrivateKey = () => {
    return process.env.FIREBASE_PRIVATE_KEY
        .replace(/^"|"$/g, "")
        .replace(/\\n/g, "\n");
};

if (hasFirebaseAdminEnv && !admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: getFirebasePrivateKey(),
        }),
    });
}

const requireAuth = async (req, res, next) => {
    if (!hasFirebaseAdminEnv) {
        return res.status(500).json({ error: "Firebase Admin is not configured" });
    }

    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
        return res.status(401).json({ error: "Missing auth token" });
    }

    try {
        req.user = await admin.auth().verifyIdToken(token);
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid auth token" });
    }
};

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.get("/api/courseListings", async (req, res) => {
    try {
        const listings = await CourseListing.find().sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch listings" });
    }
});

app.post("/api/courseListings", requireAuth, async (req,res) => {
    try {
        const { courseCode, currentSlot, desiredSlot, comments, telegramHandle } = req.body;

        const newListing = new CourseListing({
            courseCode,
            currentSlot,
            desiredSlot,
            comments,
            telegramHandle,
            createdBy: req.user.uid,
            createdByEmail: req.user.email,
        });

        const savedListing = await newListing.save();

        const match = await CourseListing.findOne({
            courseCode: courseCode,
            currentSlot: desiredSlot,
            desiredSlot: currentSlot,
        });
        // If match is found, notify both users
        if (match) {
            await notifyMatch(savedListing, match);
        }

        res.status(201).json(savedListing);
    } catch (error) {
        res.status(500).json({ error: "Failed to create listing" });
    }
});

app.delete("/api/courseListings/:id", requireAuth, async (req, res) => {
    try {
        const listing = await CourseListing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }

        if (listing.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Not authorized to delete this listing" });
        }

        await CourseListing.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: "Failed to remove listing" });
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






