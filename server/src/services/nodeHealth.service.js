const Node = require("../models/node.model");
const { createAuditLog } = require("./audit.service");

const startNodeHealthMonitor = (io) => {
  const timeoutSeconds =
    Number(process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS) || 30;

  setInterval(async () => {
    try {
      const cutoff = new Date(
        Date.now() - timeoutSeconds * 1000
      );

      const nodes = await Node.find({
        status: "ONLINE",
        isActive: true,
        "health.lastHeartbeatAt": {
          $lt: cutoff,
        },
      });

      for (const node of nodes) {
        node.status = "OFFLINE";
        await node.save();

        await createAuditLog({
          action: "NODE_OFFLINE",
          actorType: "SYSTEM",
          entityType: "NODE",
          entityId: node._id,
          previousState: "ONLINE",
          newState: "OFFLINE",
          reason: "Heartbeat timeout",
        });

        io.emit("node:offline", {
          nodeId: node.nodeId,
          location: node.location,
          status: "OFFLINE",
        });
      }
    } catch (error) {
      console.error(
        "Node health monitor error:",
        error.message
      );
    }
  }, 10000);
};

module.exports = {
  startNodeHealthMonitor,
};