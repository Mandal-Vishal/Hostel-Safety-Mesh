const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    periodKey: {
      type: String,
      required: true,
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
      building: String,
      floor: Number,
      zone: String,
    },
  },
  {
    timestamps: true,
  }
);

checkInSchema.index(
  { residentId: 1, periodKey: 1 },
  { unique: true }
);

module.exports = mongoose.model("CheckIn", checkInSchema);