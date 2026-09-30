const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const connectDB = require("./src/config/db");

const initializeSocket = require("./src/socket/socketManager");
const { initializeMQTT } = require("./src/services/mqtt.service");
const { startNodeHealthMonitor } = require("./src/services/nodeHealth.service");
const {startIncidentEscalationService} = require("./src/services/incidentEscalation.service");

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);

initializeSocket(io);

const startServer = async () => {
  try {
    await connectDB();

    initializeMQTT(io);

    startNodeHealthMonitor(io);

    startIncidentEscalationService(io)

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);

    process.exit(1);
  }
};

startServer();
