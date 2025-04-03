import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const {Pool} = pkg;


// Replace with your MongoDB URI
const DB_URI = process.env.DB_URI;

// Function to connect to MongoDB
export const connectDB = async () => {
    try {
        let connection = await mongoose.connect(DB_URI);
        console.log("MongoDB Connected Successfully!");
        return connection;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1); // Exit process on failure
    }
};
export const connectSQLDB = async()=>{
// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',         // Your PostgreSQL username
  host: 'localhost',        // Database host (use the actual host if remote)
  database: 'testData',   // Your database name
  password: String('Inhousen@123'),
  port: 5432,               // Default PostgreSQL port
});
// Test the database connection
try{
const connection = await pool.connect();
console.log("Database Connected Successfully!");
return {
    config: connection, // Original connection object
    dialect: 'postgres', // Manually defined dialect
  };
}
catch(error){
    console.error('PostgreSQL Connection Failed:', error);
    process.exit(1); // Exit process on failure
}
}
