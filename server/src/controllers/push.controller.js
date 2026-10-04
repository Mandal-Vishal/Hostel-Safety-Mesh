const PushSubscription = require("../models/pushSubscription.model");
const { sendPushToUser } = require("../services/push.service");

const getPublicKey = async (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(500).json({
        success: false,
        message: "Push notifications are not configured",
      });
    }

    res.json({
      success: true,
      publicKey: process.env.VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Get push public key error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get push public key",
    });
  }
};

const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription",
      });
    }

    const savedSubscription = await PushSubscription.findOneAndUpdate(
      {
        endpoint: subscription.endpoint,
      },
      {
        userId: req.user._id,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime
          ? new Date(subscription.expirationTime)
          : null,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(201).json({
      success: true,
      message: "Push subscription saved",
      subscriptionId: savedSubscription._id,
    });
  } catch (error) {
    console.error("Save push subscription error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save push subscription",
    });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Push endpoint is required",
      });
    }

    await PushSubscription.deleteOne({
      userId: req.user._id,
      endpoint,
    });

    res.json({
      success: true,
      message: "Push subscription removed",
    });
  } catch (error) {
    console.error("Remove push subscription error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove push subscription",
    });
  }
};
const sendTestPush = async (req, res) => {
  try {
    await sendPushToUser(req.user._id, {
      title: "Hostel Safety Mesh",
      body: "Real push notification is working!",
      url: "/",
      tag: "push-test",
      requireInteraction: true,
    });

    res.json({
      success: true,
      message: "Test push sent",
    });
  } catch (error) {
    console.error("Test push error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send test push",
    });
  }
};

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendTestPush,
};
