const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const initializeSocket = (io) => {
  /**
   * -------------------------------------------------------
   * SOCKET AUTHENTICATION
   * -------------------------------------------------------
   *
   * Every Socket.IO connection must provide a valid
   * JWT through:
   *
   * socket.handshake.auth.token
   *
   * The token is verified first.
   * The user is then reloaded from MongoDB so that
   * the current account status/role is authoritative.
   */
  io.use(async (socket, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return next(new Error("Socket authentication unavailable"));
      }

      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token.trim()) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      /**
       * The JWT must contain a userId.
       */
      if (!decoded?.userId) {
        return next(new Error("Invalid token payload"));
      }

      /**
       * Never trust the role stored in the JWT
       * as the current source of authorization.
       *
       * Reload the user from MongoDB and use the
       * current database role.
       */
      const user = await User.findById(decoded.userId)
        .select("_id role isActive")
        .lean();

      if (!user || !user.isActive) {
        return next(new Error("Invalid user"));
      }

      /**
       * Store only the minimum authentication
       * context required by Socket.IO.
       *
       * Do NOT attach the complete User document.
       */
      socket.user = {
        userId: user._id.toString(),

        role: user.role,
      };

      return next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);

      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;

    const role = socket.user.role;

    /**
     * ---------------------------------------------------
     * ROOM MEMBERSHIP
     * ---------------------------------------------------
     *
     * The server decides which rooms the connection
     * belongs to.
     *
     * Clients cannot choose their own role room.
     */
    socket.join(`user:${userId}`);

    socket.join(`role:${role}`);

    console.log(`Socket connected: ${userId} (${role})`);

    /**
     * Keep connection acknowledgement minimal.
     *
     * No email, location, password information,
     * or other user fields are sent here.
     */
    socket.emit("connection:success", {
      message: "Connected to Hostel Safety Mesh",

      userId,

      role,
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${userId} (${role}) - ${reason}`);
    });
  });
};

module.exports = initializeSocket;
