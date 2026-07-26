require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const CourseListing = require("./models/CourseListing");
const Item = require("./models/Item");
const SwapMatch = require("./models/SwapMatch");
require("./bot"); // registers callback_query / command handlers as a side effect
const { queueMatchNotification } = require("./bot/notify");
const { startExpiryJob } = require("./jobs/expireMatches");
const { findAllMatches } = require("./utils/matchCourses");
const UserProfile = require("./models/UserProfile");
const Survey = require("./models/Survey");

const MATCH_TTL_MS = 24 * 60 * 60 * 1000;
const app = express();
const PORT = 5050;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

const normalizeText = (value) => {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
};

const surveyMatchesProfile = (profile, survey) => {
    if (!profile) return false;

    if (
        (survey.minAge !== undefined && survey.minAge !== null) ||
        (survey.maxAge !== undefined && survey.maxAge !== null)
    ) {
        if (profile.age === undefined || profile.age === null) return false;

        if (
            survey.minAge !== undefined &&
            survey.minAge !== null &&
            profile.age < survey.minAge
        ) {
            return false;
        }

        if (
            survey.maxAge !== undefined &&
            survey.maxAge !== null &&
            profile.age > survey.maxAge
        ) {
            return false;
        }
    }

    if (survey.sex && survey.sex !== "") {
        if (!profile.sex || profile.sex !== survey.sex) return false;
    }

    if (survey.major && survey.major !== "") {
        if (normalizeText(profile.major) !== normalizeText(survey.major)) {
            return false;
        }
    }

    return true;
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

app.post("/api/courseListings", requireAuth, async (req, res) => {
    try {
        const {
            courseCode,
            currentSlot,
            desiredSlot,
            comments,
            telegramHandle,
        } = req.body;

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
        console.log("Saved listing:", savedListing.courseCode, savedListing.currentSlot, "->", savedListing.desiredSlot);

        // check for matches
        const matches = await findAllMatches(savedListing);
        console.log(`Found ${matches.length} match(es) for`, savedListing._id.toString());

        res.status(201).json(savedListing);

        // Create match records and notify after responding — matching/notifying
        // should never hold up the API response.
        for (const otherListing of matches) {
            try {
                const swapMatch = await SwapMatch.create({
                    listingA: savedListing._id,
                    listingB: otherListing._id,
                    expiresAt: new Date(Date.now() + MATCH_TTL_MS),
                });

                await CourseListing.updateMany(
                    { _id: { $in: [savedListing._id, otherListing._id] } },
                    { $set: { status: "pending" } }
                );

                queueMatchNotification(swapMatch._id, savedListing.telegramHandle, otherListing, otherListing.telegramHandle);
                queueMatchNotification(swapMatch._id, otherListing.telegramHandle, savedListing, savedListing.telegramHandle);
            } catch (matchError) {
                console.error("Failed to create/notify match for", otherListing._id, matchError);
            }
        }

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

app.get("/api/items", async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });

        const sellerUids = [...new Set(items.map((item) => item.createdBy).filter(Boolean))];

        const profiles = sellerUids.length > 0
            ? await UserProfile.find({ uid: { $in: sellerUids } }).select("uid telegramHandle")
            : [];

        const profileMap = new Map(profiles.map((profile) => [profile.uid, profile]));

        const itemsWithSeller = items.map((item) => {
            const profile = profileMap.get(item.createdBy);

            return {
                ...item.toObject(),
                sellerTelegramHandle: profile?.telegramHandle || "",
            };
        });

        res.json(itemsWithSeller);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

app.post("/api/items", requireAuth, async (req, res) => {
  try {
    const { title, price, description, category, image } = req.body;

    const newItem = new Item({
      title,
      price,
      description,
      category,
      image,
      createdBy: req.user.uid,
      createdByEmail: req.user.email,
    });

    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to create item" });
  }
});

app.get("/api/profile/me", requireAuth, async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ uid: req.user.uid });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

app.put("/api/profile/me", requireAuth, async (req, res) => {
    try {
        const { name, age, sex, major, telegramHandle } = req.body;

        let parsedAge;
        if (age === "" || age === null || age === undefined) {
            parsedAge = undefined;
        } else {
            parsedAge = Number(age);
            if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120) {
                return res.status(400).json({ error: "Age must be a valid number between 0 and 120" });
            }
        }

        if (sex && !["M", "F"].includes(sex)) {
            return res.status(400).json({ error: "Sex must be M or F" });
        }

        const normalizedTelegramHandle =
            typeof telegramHandle === "string"
                ? telegramHandle.trim().replace(/^@/, "")
                : "";

        if (!normalizedTelegramHandle) {
            return res.status(400).json({ error: "Telegram handle is required" });
        }

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { uid: req.user.uid },
            {
                uid: req.user.uid,
                email: req.user.email,
                name: typeof name === "string" ? name.trim() : "",
                age: parsedAge,
                sex: typeof sex === "string" ? sex.trim() : "",
                major: typeof major === "string" ? major.trim() : "",
                telegramHandle: normalizedTelegramHandle,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        res.json(updatedProfile);
    } catch (error) {
        console.error("Failed to save profile:", error);
        res.status(500).json({ error: "Failed to save profile" });
    }
});

app.get("/api/surveys", async (req, res) => {
    try {
        const surveys = await Survey.find().sort({ createdAt: -1 });
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch surveys" });
    }
});

app.get("/api/surveys/matching", requireAuth, async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ uid: req.user.uid });

        if (!profile) {
            return res.json([]);
        }

        const surveys = await Survey.find().sort({ createdAt: -1 });
        const matchingSurveys = surveys.filter((survey) =>
            surveyMatchesProfile(profile, survey)
        );

        res.json(matchingSurveys);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch matching surveys" });
    }
});

app.post("/api/surveys", requireAuth, async (req, res) => {
    try {
        const {
            title,
            description,
            remuneration,
            telegramHandle,
            minAge,
            maxAge,
            sex,
            major,
        } = req.body;

        if (!title || !description || !remuneration || !telegramHandle) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let parsedMinAge;
        if (minAge === "" || minAge === null || minAge === undefined) {
            parsedMinAge = undefined;
        } else {
            parsedMinAge = Number(minAge);
            if (
                !Number.isInteger(parsedMinAge) ||
                parsedMinAge < 0 ||
                parsedMinAge > 120
            ) {
                return res.status(400).json({ error: "Minimum age must be a valid number between 0 and 120" });
            }
        }

        let parsedMaxAge;
        if (maxAge === "" || maxAge === null || maxAge === undefined) {
            parsedMaxAge = undefined;
        } else {
            parsedMaxAge = Number(maxAge);
            if (
                !Number.isInteger(parsedMaxAge) ||
                parsedMaxAge < 0 ||
                parsedMaxAge > 120
            ) {
                return res.status(400).json({ error: "Maximum age must be a valid number between 0 and 120" });
            }
        }

        if (
            parsedMinAge !== undefined &&
            parsedMaxAge !== undefined &&
            parsedMinAge > parsedMaxAge
        ) {
            return res.status(400).json({ error: "Minimum age cannot be greater than maximum age" });
        }

        if (sex && !["M", "F"].includes(sex)) {
            return res.status(400).json({ error: "Gender must be M or F" });
        }

        const normalizedTelegramHandle =
            typeof telegramHandle === "string"
                ? telegramHandle.trim().replace(/^@/, "")
                : "";

        if (!normalizedTelegramHandle) {
            return res.status(400).json({ error: "Telegram handle is required" });
        }

        const newSurvey = new Survey({
            title: typeof title === "string" ? title.trim() : "",
            description: typeof description === "string" ? description.trim() : "",
            remuneration: typeof remuneration === "string" ? remuneration.trim() : "",
            telegramHandle: normalizedTelegramHandle,
            minAge: parsedMinAge,
            maxAge: parsedMaxAge,
            sex: typeof sex === "string" ? sex.trim() : "",
            major: typeof major === "string" ? major.trim() : "",
            createdBy: req.user.uid,
            createdByEmail: req.user.email,
        });

        const savedSurvey = await newSurvey.save();
        res.status(201).json(savedSurvey);
    } catch (error) {
        console.error("Failed to create survey:", error);
        res.status(500).json({ error: "Failed to create survey" });
    }
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        startExpiryJob();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });






