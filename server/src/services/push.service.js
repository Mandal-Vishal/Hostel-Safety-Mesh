const webpush = require("web-push");
const PushSubscription = require("../models/pushSubscription.model");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.warn("Web Push disabled: VAPID environment variables are missing.");
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const sendPushToSubscriptions = async (subscriptions, notification) => {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return;
  }

  await Promise.allSettled(
    subscriptions.map(async (subscriptionDoc) => {
      const subscription = {
        endpoint: subscriptionDoc.endpoint,
        expirationTime: subscriptionDoc.expirationTime
          ? new Date(subscriptionDoc.expirationTime).getTime()
          : null,
        keys: {
          p256dh: subscriptionDoc.keys.p256dh,
          auth: subscriptionDoc.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notification),
          {
            TTL: 60,
            urgency: "high",
          },
        );
      } catch (error) {
        console.error(
          `Push notification failed for endpoint ${subscription.endpoint}`,
          error.statusCode,
          error.message,
        );

        // Subscription expired / no longer valid
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({
            _id: subscriptionDoc._id,
          });
        }
      }
    }),
  );
};

const sendPushToUsers = async (userIds, notification) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return;
  }

  const subscriptions = await PushSubscription.find({
    userId: {
      $in: userIds,
    },
  });

  await sendPushToSubscriptions(subscriptions, notification);
};

const sendPushToRoles = async (roles, notification) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return;
  }

  const User = require("../models/user.model");

  const users = await User.find({
    role: {
      $in: roles,
    },
    isActive: true,
  }).select("_id");

  const userIds = users.map((user) => user._id);

  await sendPushToUsers(userIds, notification);
};

const sendPushToUser = async (userId, notification) => {
  await sendPushToUsers([userId], notification);
};

module.exports = {
  sendPushToUsers,
  sendPushToUser,
  sendPushToRoles,
};
