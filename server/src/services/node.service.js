const Node = require("../models/node.model");

const upsertNode = async ({
  nodeId,
  name,
  type,
  location,
  eventType,
  health,
}) => {
  const update = {
    name: name || `Node ${nodeId}`,
    type: type || "CORRIDOR_CALL_NODE",
    location,
    updatedAt: new Date(),
  };

  if (eventType === "NODE_ONLINE" || eventType === "HEARTBEAT") {
    update.status = "ONLINE";
  }

  if (eventType === "NODE_OFFLINE") {
    update.status = "OFFLINE";
  }

  if (health) {
    update["health.batteryLevel"] =
      health.batteryLevel ?? null;

    update["health.signalQuality"] =
      health.signalQuality ?? null;

    update["health.uptimeSeconds"] =
      health.uptimeSeconds ?? 0;
  }

  if (
    eventType === "HEARTBEAT" ||
    eventType === "NODE_ONLINE"
  ) {
    update["health.lastHeartbeatAt"] = new Date();
  }

  return Node.findOneAndUpdate(
    { nodeId },
    { $set: update },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

module.exports = {
  upsertNode,
};