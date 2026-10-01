const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },

    actor: {
      type: {
        type: String,
        enum: ["USER", "SYSTEM", "IOT_NODE"],
        required: true,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      role: {
        type: String,
        default: null,
      },
    },

    entity: {
      type: {
        type: String,
        required: true,
      },

      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },

    previousState: {
      type: String,
      default: null,
    },

    newState: {
      type: String,
      default: null,
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    previousHash: {
      type: String,
      default: null,
      immutable: true,
    },

    hash: {
      type: String,
      required: true,
      immutable: true,
    },

    signature: {
      type: String,
      required: true,
      immutable: true,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);