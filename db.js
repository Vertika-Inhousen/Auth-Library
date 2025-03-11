const mongoose = require('mongoose');
require('dotenv').config();

// Replace with your MongoDB URI
const DB_URI = process.env.DB_URI;

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        let connection = await mongoose.connect(DB_URI);
        console.log("MongoDB Connected Successfully!");
        return connection;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1); // Exit process on failure
    }
};

module.exports = connectDB;
