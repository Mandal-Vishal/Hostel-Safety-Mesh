const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      trim: true,
    },

    floor: {
      type: Number,
      min: 0,
    },

    room: {
      type: String,
      trim: true,
    },

    zone: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const currentZoneSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      trim: true,
    },

    floor: {
      type: Number,
      min: 0,
    },

    zone: {
      type: String,
      trim: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["resident", "warden", "security"],
      required: true,
    },

    hostel: {
      type: locationSchema,
      default: null,
    },

    currentZone: {
      type: currentZoneSchema,
      default: null,
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

const User = mongoose.model("User", userSchema);

module.exports = User;