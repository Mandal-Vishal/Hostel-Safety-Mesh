const Node = require("../models/node.model");

const { createAuditLog } = require("./audit.service");

const { sanitizeNode } = require("../utils/privacy");

const NODE_HEALTH_CHECK_INTERVAL_MS = Number(
  process.env.NODE_HEALTH_CHECK_INTERVAL_MS || 10000,
);

const NODE_HEARTBEAT_TIMEOUT_SECONDS = Number(
  process.env.NODE_HEARTBEAT_TIMEOUT_SECONDS || 30,
);

let healthMonitorInterval = null;

/**
 * Prevent overlapping health scans.
 *
 * The monitor performs asynchronous database operations.
 * If a scan takes longer than the configured interval,
 * another scan must not start on top of it.
 */
let healthScanRunning = false;

/**
 * Check for nodes that have stopped sending
 * heartbeat information.
 */
const checkNodeHealth = async (io) => {
  /**
   * Skip this scan if the previous scan is
   * still running.
   */
  if (healthScanRunning) {
    return;
  }

  healthScanRunning = true;

  try {
    const cutoff = new Date(Date.now() - NODE_HEARTBEAT_TIMEOUT_SECONDS * 1000);

    /**
     * Only currently-online nodes are candidates.
     *
     * Once a node is marked OFFLINE, it will not
     * repeatedly generate NODE_OFFLINE audit events.
     */
    const nodes = await Node.find({
      status: "ONLINE",

      isActive: true,

      "health.lastHeartbeatAt": {
        $lt: cutoff,
      },
    });

    for (const node of nodes) {
      /**
       * Atomic state transition.
       *
       * If another process already changed this
       * node's state, this update returns null.
       */
      const updatedNode = await Node.findOneAndUpdate(
        {
          _id: node._id,

          status: "ONLINE",

          isActive: true,

          "health.lastHeartbeatAt": {
            $lt: cutoff,
          },
        },

        {
          $set: {
            status: "OFFLINE",
          },
        },

        {
          new: true,

          runValidators: true,
        },
      );

      /**
       * Another process already handled the node.
       */
      if (!updatedNode) {
        continue;
      }

      /**
       * Record the transition in the same
       * tamper-evident audit system used by
       * incident operations.
       */
      await createAuditLog({
        action: "NODE_OFFLINE",

        actor: {
          type: "SYSTEM",

          userId: null,

          role: "SYSTEM",
        },

        entity: {
          type: "NODE",

          entityId: updatedNode._id,
        },

        previousState: "ONLINE",

        newState: "OFFLINE",

        metadata: {
          reason: "Heartbeat timeout",

          timeoutSeconds: NODE_HEARTBEAT_TIMEOUT_SECONDS,
        },
      });

      /**
       * Build a privacy-filtered operational
       * representation.
       *
       * No simulator configuration or other
       * internal node fields are exposed.
       */
      const safeNode = sanitizeNode(updatedNode, "warden");

      /**
       * Only operational roles should receive
       * infrastructure health events.
       *
       * Do NOT use io.emit() because that would
       * broadcast the node location to every
       * connected user.
       */
      if (io) {
        io.to("role:warden").emit("node:offline", {
          node: safeNode,
        });

        io.to("role:security").emit("node:offline", {
          node: sanitizeNode(updatedNode, "security"),
        });
      }

      console.log(
        `Node ${updatedNode.nodeId} marked OFFLINE after heartbeat timeout`,
      );
    }
  } catch (error) {
    console.error("Node health monitor error:", error);
  } finally {
    /**
     * Always release the scan lock.
     */
    healthScanRunning = false;
  }
};

const startNodeHealthMonitor = (io) => {
  /**
   * Prevent multiple monitors from being
   * started accidentally.
   */
  if (healthMonitorInterval) {
    return;
  }

  console.log(
    `Node health monitor started. Heartbeat timeout: ${NODE_HEARTBEAT_TIMEOUT_SECONDS}s`,
  );

  /**
   * Run once immediately at startup.
   */
  checkNodeHealth(io);

  /**
   * Continue monitoring periodically.
   */
  healthMonitorInterval = setInterval(() => {
    checkNodeHealth(io);
  }, NODE_HEALTH_CHECK_INTERVAL_MS);
};

const stopNodeHealthMonitor = () => {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);

    healthMonitorInterval = null;
  }

  healthScanRunning = false;
};

module.exports = {
  startNodeHealthMonitor,
  stopNodeHealthMonitor,
  checkNodeHealth,
};
