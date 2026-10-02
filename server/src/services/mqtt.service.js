const mqtt = require("mqtt");

const Node = require("../models/node.model");
const Incident = require("../models/incident.model");

const { upsertNode } = require("./node.service");

const { createAuditLog } = require("./audit.service");

const { sanitizeNode, sanitizeIncident } = require("../utils/privacy");

const SUPPORTED_EVENT_TYPES = [
  "NODE_ONLINE",
  "HEARTBEAT",
  "NODE_OFFLINE",
  "SOS",
];

let mqttClient = null;

/**
 * Validate the basic shape of an MQTT event.
 */
const validateMQTTEvent = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      valid: false,
      reason: "MQTT payload must be a JSON object",
    };
  }

  const { eventId, eventType, nodeId } = payload;

  if (typeof eventId !== "string" || !eventId.trim()) {
    return {
      valid: false,
      reason: "eventId is required",
    };
  }

  if (
    typeof eventType !== "string" ||
    !SUPPORTED_EVENT_TYPES.includes(eventType)
  ) {
    return {
      valid: false,
      reason: "Unsupported MQTT event type",
    };
  }

  if (typeof nodeId !== "string" || !nodeId.trim()) {
    return {
      valid: false,
      reason: "nodeId is required",
    };
  }

  return {
    valid: true,
  };
};

/**
 * Create a privacy-safe node payload for
 * operational Socket.IO consumers.
 */
const formatSafeNode = (node, role) => {
  return sanitizeNode(node, role);
};

/**
 * Create a privacy-safe incident payload
 * for a given role.
 */
const formatSafeIncident = (incident, role) => {
  return sanitizeIncident(incident, role);
};

const initializeMQTT = (io) => {
  mqttClient = mqtt.connect(
    process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1:1883",
  );

  mqttClient.on("connect", () => {
    console.log("MQTT broker connected");

    mqttClient.subscribe(
      process.env.MQTT_TOPIC || "hostel/nodes/+/events",
      (error) => {
        if (error) {
          console.error("MQTT subscribe error:", error.message);

          return;
        }

        console.log("Subscribed to MQTT node events");
      },
    );
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const rawMessage = message.toString();

      let payload;

      try {
        payload = JSON.parse(rawMessage);
      } catch {
        console.error(`Invalid MQTT JSON received on ${topic}`);

        return;
      }

      await handleMQTTEvent(payload, io, topic);
    } catch (error) {
      console.error("MQTT message error:", error.message);
    }
  });

  mqttClient.on("error", (error) => {
    console.error("MQTT error:", error.message);
  });

  mqttClient.on("close", () => {
    console.log("MQTT connection closed");
  });

  mqttClient.on("reconnect", () => {
    console.log("MQTT reconnecting...");
  });

  return mqttClient;
};

const handleMQTTEvent = async (payload, io, topic = "") => {
  const validation = validateMQTTEvent(payload);

  if (!validation.valid) {
    console.warn("Invalid MQTT event:", validation.reason);

    return;
  }

  const { eventId, eventType, nodeId, name, type, location, health } = payload;

  /**
   * NODE ONLINE / HEARTBEAT /
   * NODE OFFLINE are the only supported
   * infrastructure events.
   */
  const node = await upsertNode({
    nodeId: nodeId.trim(),

    name,

    type,

    location,

    eventType,

    health,
  });

  if (!node) {
    console.error(`Unable to create/update node ${nodeId}`);

    return;
  }

  /**
   * -------------------------------------------------------
   * NODE ONLINE
   * -------------------------------------------------------
   */
  if (eventType === "NODE_ONLINE") {
    const wardenNode = formatSafeNode(node, "warden");

    const securityNode = formatSafeNode(node, "security");

    /**
     * Do not use io.emit().
     *
     * Node infrastructure information is
     * operational data and should only reach
     * operational roles.
     */
    if (io) {
      io.to("role:warden").emit("node:online", {
        node: wardenNode,
      });

      io.to("role:security").emit("node:online", {
        node: securityNode,
      });
    }

    return;
  }

  /**
   * -------------------------------------------------------
   * HEARTBEAT
   * -------------------------------------------------------
   */
  if (eventType === "HEARTBEAT") {
    const wardenNode = formatSafeNode(node, "warden");

    const securityNode = formatSafeNode(node, "security");

    if (io) {
      io.to("role:warden").emit("node:health", {
        node: wardenNode,
      });

      io.to("role:security").emit("node:health", {
        node: securityNode,
      });
    }

    return;
  }

  /**
   * -------------------------------------------------------
   * NODE OFFLINE
   * -------------------------------------------------------
   */
  if (eventType === "NODE_OFFLINE") {
    /**
     * Only transition ONLINE → OFFLINE.
     *
     * This prevents duplicate offline events
     * from repeatedly generating audit entries.
     */
    const updatedNode = await Node.findOneAndUpdate(
      {
        nodeId: nodeId.trim(),

        status: "ONLINE",
      },

      {
        $set: {
          status: "OFFLINE",

          updatedAt: new Date(),
        },
      },

      {
        new: true,

        runValidators: true,
      },
    );

    /**
     * Another health process may have already
     * marked the node offline.
     */
    if (!updatedNode) {
      return;
    }

    await createAuditLog({
      action: "NODE_OFFLINE",

      actor: {
        type: "IOT_NODE",

        userId: null,

        role: "IOT_NODE",
      },

      entity: {
        type: "NODE",

        entityId: updatedNode._id,
      },

      previousState: "ONLINE",

      newState: "OFFLINE",

      metadata: {
        reason: "Node reported offline through MQTT",

        nodeId: updatedNode.nodeId,
      },
    });

    const wardenNode = formatSafeNode(updatedNode, "warden");

    const securityNode = formatSafeNode(updatedNode, "security");

    if (io) {
      io.to("role:warden").emit("node:offline", {
        node: wardenNode,
      });

      io.to("role:security").emit("node:offline", {
        node: securityNode,
      });
    }

    return;
  }

  /**
   * -------------------------------------------------------
   * IOT SOS
   * -------------------------------------------------------
   */
  if (eventType === "SOS") {
    /**
     * Fast duplicate check.
     */
    const existing = await Incident.findOne({
      "source.eventId": eventId,
    });

    if (existing) {
      console.log(`Duplicate MQTT event ignored: ${eventId}`);

      return;
    }

    let incident;

    try {
      incident = await Incident.create({
        incidentId: `INC-${Date.now()}-${Math.floor(
          100 + Math.random() * 900,
        )}`,

        type: "SOS",

        source: {
          type: "IOT_NODE",

          userId: null,

          nodeId: node._id,

          eventId,
        },

        residentId: null,

        location: node.location || null,

        status: "PENDING",
      });
    } catch (error) {
      /**
       * The unique eventId index is the final
       * protection against concurrent duplicate
       * messages.
       */
      if (error?.code === 11000) {
        console.log(`Duplicate MQTT event ignored by unique index: ${eventId}`);

        return;
      }

      throw error;
    }

    await createAuditLog({
      action: "SOS_CREATED",

      actor: {
        type: "IOT_NODE",

        userId: null,

        role: "IOT_NODE",
      },

      entity: {
        type: "INCIDENT",

        entityId: incident._id,
      },

      previousState: null,

      newState: "PENDING",

      metadata: {
        source: "MQTT",

        nodeId: node.nodeId,

        eventId,
      },
    });

    /**
     * IOT incidents have no residentId,
     * so the privacy layer will omit resident
     * identity information automatically.
     */
    const wardenIncident = formatSafeIncident(incident, "warden");

    const securityIncident = formatSafeIncident(incident, "security");

    if (io) {
      io.to("role:warden").emit("incident:new", {
        incident: wardenIncident,
      });

      io.to("role:security").emit("incident:new", {
        incident: securityIncident,
      });
    }

    console.log(`IoT SOS received from ${nodeId} on ${topic}`);

    return;
  }
};

module.exports = {
  initializeMQTT,
  handleMQTTEvent,
};
