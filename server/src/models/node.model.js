const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    nodeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["CORRIDOR_CALL_NODE", "ROOM_CALL_NODE"],
      required: true,
    },

    location: {
      building: String,
      floor: Number,
      zone: String,
    },

    status: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
      default: "OFFLINE",
      index: true,
    },

    health: {
      lastHeartbeatAt: {
        type: Date,
        default: null,
      },

      batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      signalQuality: {
        type: String,
        default: null,
      },

      uptimeSeconds: {
        type: Number,
        default: 0,
      },
    },

    simulator: {
      enabled: {
        type: Boolean,
        default: true,
      },

      failureMode: {
        type: String,
        default: null,
      },

      delayMs: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Node", nodeSchema);