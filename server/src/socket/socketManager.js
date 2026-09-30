const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const initializeSocket = (io) => {
  // Authenticate socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(
        decoded.userId
      ).select("-passwordHash");

      if (!user || !user.isActive) {
        return next(
          new Error("Invalid user")
        );
      }

      socket.user = user;

      next();
    } catch (error) {
      next(
        new Error("Invalid or expired token")
      );
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const role = socket.user.role;

    // User-specific room
    socket.join(`user:${userId}`);

    // Role room
    socket.join(`role:${role}`);

    console.log(
      `Socket connected: ${userId} (${role})`
    );

    socket.emit("connection:success", {
      message: "Connected to Hostel Safety Mesh",
      userId,
      role,
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${userId} (${role})`
      );
    });
  });
};

module.exports = initializeSocket;