const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    floor: {
      type: Number,
      min: 0,
      max: 100,
    },

    zone: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    _id: false,
  },
);

const sourceSchema = new mongoose.Schema(
  {
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

    /**
     * eventId is primarily used for MQTT/IOT
     * idempotency.
     */
    eventId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: undefined,
    },
  },
  {
    _id: false,
  },
);

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["SOS"],
      required: true,
    },

    source: {
      type: sourceSchema,
      required: true,
    },

    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    location: {
      type: locationSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACKNOWLEDGED", "ESCALATED", "RESOLVED"],
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
      trim: true,
      maxlength: 500,
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
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Prevent duplicate IOT/MQTT events from creating
 * multiple incidents.
 *
 * Resident-app incidents normally do not provide
 * an eventId, so they are unaffected.
 */
incidentSchema.index(
  {
    "source.eventId": 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      "source.eventId": {
        $type: "string",
      },
    },
  },
);

module.exports = mongoose.model("Incident", incidentSchema);
