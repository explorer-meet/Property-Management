const mongoose = require("mongoose");

const connectDB = async (url) => {
  try {
    if (!url) {
      throw new Error("MONGO_URL is not configured");
    }

    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
    });
    return true;
  } catch (err) {
    console.log("DB Connection Error:", err.message);
    return false;
  }
};

module.exports = connectDB;
