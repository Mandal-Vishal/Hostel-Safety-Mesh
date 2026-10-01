const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["SOS"],
      required: true,
    },

    source: {
      type: {
        type: String,
        enum: ["RESIDENT_APP", "IOT_NODE"],
        required: true,
      },

      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      nodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        default: null,
      },

      eventId: {
        type: String,
        default: undefined,
      },
    },

    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    location: {
      building: String,
      floor: Number,
      zone: String,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACKNOWLEDGED",
        "ESCALATED",
        "RESOLVED",
      ],
      default: "PENDING",
      index: true,
    },

    acknowledgedAt: {
      type: Date,
      default: null,
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    escalatedAt: {
      type: Date,
      default: null,
    },

    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    escalationReason: {
      type: String,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolutionNote: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

incidentSchema.index(
  { "source.eventId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "source.eventId": {
        $type: "string",
      },
    },
  }
);

module.exports = mongoose.model("Incident", incidentSchema);