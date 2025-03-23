const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const verifyToken = require("./authMiddleware");
const FoodEntry = require("./FoodEntry");

// User Model
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    goals: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number
    }
});
const User = mongoose.model("User", UserSchema);

// Register Route
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Error registering user" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
});

// Goal Setting Route
app.post("/goals", verifyToken, async (req, res) => {
    try {
        const { calories, protein, carbs, fats } = req.body;
        const user = await User.findByIdAndUpdate(req.userId, {
            goals: { calories, protein, carbs, fats }
        }, { new: true });

        res.json({ message: "Goals updated", goals: user.goals });
    } catch (err) {
        res.status(500).json({ error: "Could not update goals" });
    }
});

// Food Logging
app.post("/log", verifyToken, async (req, res) => {
    try {
        const { name, calories, protein, carbs, fats } = req.body;
        const entry = new FoodEntry({
            userId: req.userId,
            name, calories, protein, carbs, fats
        });
        await entry.save();
        res.json({ message: "Food logged", entry });
    } catch (err) {
        res.status(500).json({ error: "Could not log food" });
    }
});

// Progress Tracking
app.get("/progress", verifyToken, async (req, res) => {
    try {
        const entries = await FoodEntry.find({ userId: req.userId });
        res.json({ entries });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});

// Recipe Suggestions (Sample API Integration)
app.get("/recipes", async (req, res) => {
    try {
        const response = await axios.get("https://api.spoonacular.com/recipes/random", {
            params: {
                number: 5,
                apiKey: "YOUR_SPOONACULAR_KEY"
            }
        });

        res.json(response.data.recipes);
    } catch (err) {
        res.status(500).json({ error: "Recipe fetch failed" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
