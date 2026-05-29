const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5050;
app.use(cors());
app.use(express.json());

let listings = []

app.get("/api/listings", (req, res) => {
    res.json(listings);
});
app.post("/api/listings", (req,res) => {
    const newListing = req.body;
    listings.push(newListing);
    res.status(201).json(newListing);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
