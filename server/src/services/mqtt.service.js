const mqtt = require("mqtt");

const Node = require("../models/node.model");
const Incident = require("../models/incident.model");

const { upsertNode } = require("./node.service");
const { createAuditLog } = require("./audit.service");

let mqttClient = null;

const initializeMQTT = (io) => {
  mqttClient = mqtt.connect(
    process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1:1883"
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
      }
    );
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());

      await handleMQTTEvent(payload, io);
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

  return mqttClient;
};

const handleMQTTEvent = async (payload, io) => {
  const {
    eventId,
    eventType,
    nodeId,
    name,
    type,
    location,
    health,
  } = payload;

  if (!eventId || !eventType || !nodeId) {
    console.log("Invalid MQTT event:", payload);
    return;
  }

  // Update/create node
  const node = await upsertNode({
    nodeId,
    name,
    type,
    location,
    eventType,
    health,
  });

  // NODE ONLINE
  if (eventType === "NODE_ONLINE") {
    io.emit("node:online", {
      nodeId,
      location,
      status: "ONLINE",
    });

    return;
  }

  // HEARTBEAT
  if (eventType === "HEARTBEAT") {
    io.emit("node:health", {
      nodeId,
      status: "ONLINE",
      health: node.health,
    });

    return;
  }
  
  // NODE OFFLINE
  if (eventType === "NODE_OFFLINE") {
    await Node.findOneAndUpdate(
      { nodeId },
      {
        status: "OFFLINE",
        updatedAt: new Date(),
      }
    );

    await createAuditLog({
      action: "NODE_OFFLINE",
      actorType: "IOT_NODE",
      entityType: "NODE",
      entityId: node._id,
      previousState: "ONLINE",
      newState: "OFFLINE",
    });

    io.emit("node:offline", {
      nodeId,
      location,
      status: "OFFLINE",
    });

    return;
  }
  
  // IOT SOS
  if (eventType === "SOS") {
    // Duplicate event protection
    const existing = await Incident.findOne({
      "source.eventId": eventId,
    });

    if (existing) {
      console.log(`Duplicate MQTT event ignored: ${eventId}`);
      return;
    }

    const incident = await Incident.create({
      incidentId: `INC-${Date.now()}-${Math.floor(
        100 + Math.random() * 900
      )}`,

      type: "SOS",

      source: {
        type: "IOT_NODE",
        userId: null,
        nodeId: node._id,
        eventId,
      },

      residentId: null,

      location: node.location,

      status: "PENDING",
    });

    await createAuditLog({
      action: "SOS_CREATED",
      actorType: "IOT_NODE",
      entityType: "INCIDENT",
      entityId: incident._id,
      previousState: null,
      newState: "PENDING",
    });

    io.emit("incident:new", {
      incident,
    });

    console.log(
      `IoT SOS received from ${nodeId}`
    );
  }
};

module.exports = {
  initializeMQTT,
};