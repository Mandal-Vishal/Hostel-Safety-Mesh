require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const { initializeMQTT } = require("./services/mqtt.service");
const { startNodeHealthMonitor } = require("./services/nodeHealth.service");

const PORT = process.env.PORT || 5000;

const http = require("http");
const { Server } = require("socket.io");

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    initializeMQTT(io);

    startNodeHealthMonitor(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);

    process.exit(1);
  }
};

startServer();
