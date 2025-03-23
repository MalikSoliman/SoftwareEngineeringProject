const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FoodEntry", FoodSchema);
