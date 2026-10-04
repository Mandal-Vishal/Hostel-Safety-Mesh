const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expirationTime: {
      type: Date,
      default: null,
    },

    keys: {
      p256dh: {
        type: String,
        required: true,
      },

      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
