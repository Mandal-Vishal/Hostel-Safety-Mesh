const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
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

const checkInSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    periodKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["EXPECTED", "CHECKED_IN", "MISSED"],
      default: "EXPECTED",
      index: true,
    },

    source: {
      type: {
        type: String,
        enum: ["RESIDENT_APP", "IOT_NODE"],
        default: "RESIDENT_APP",
      },

      nodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        default: null,
      },
    },

    zone: {
      type: zoneSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * A resident can have only one check-in
 * record for a particular night period.
 */
checkInSchema.index(
  {
    residentId: 1,
    periodKey: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("CheckIn", checkInSchema);
