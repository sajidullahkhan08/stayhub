require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Sequelize } = require("sequelize");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Set to true if you want to see SQL queries in the terminal
});

// Test Route
app.get("/api/message", async (req, res) => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    res.json({
      message: "Hello from Express! Database connected successfully..!",
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to connect to database",
      error: error.message,
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
