const express = require("express");
const cors = require("cors");

const app = express();

// -------------------------
// Global middleware
// -------------------------

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// -------------------------
// Health check
// -------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hostel Safety Mesh API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;