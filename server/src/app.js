const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route")
const checkinRoutes = require('./routes/checkIn.route')
const incidentRoutes = require('./routes/incident.route')

const app = express();

// Global middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hostel Safety Mesh API is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users" , userRoutes)
app.use("/api/checkins", checkinRoutes)
app.use("/api/incidents" , incidentRoutes)

module.exports = app;