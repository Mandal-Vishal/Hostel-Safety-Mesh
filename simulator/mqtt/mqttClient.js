const mqtt = require("mqtt");
const crypto = require("crypto");

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1:1883";

let client;

const connectMQTT = () => {
  client = mqtt.connect(brokerUrl);

  client.on("connect", () => {
    console.log("Simulator connected to MQTT broker");
  });

  client.on("error", (error) => {
    console.error("Simulator MQTT error:", error.message);
  });

  client.on("close", () => {
    console.log("Simulator MQTT connection closed");
  });

  return client;
};

const publishEvent = (node, eventType, extra = {}) => {
  if (!client || !client.connected) {
    console.log("MQTT is not connected");
    return;
  }

  const event = {
    eventId: crypto.randomUUID(),
    eventType,
    nodeId: node.nodeId,
    name: node.name,
    type: node.type,
    location: node.location,
    timestamp: new Date(),
    ...extra,
  };

  const topic = `hostel/nodes/${node.nodeId}/events`;

  client.publish(topic, JSON.stringify(event), (error) => {
    if (error) {
      console.error("MQTT publish error:", error.message);
      return;
    }

    if (eventType !== "HEARTBEAT") {
      console.log(`[${node.nodeId}] ${eventType} sent`);
    }
  });

  return event;
};

const disconnectMQTT = () => {
  if (client) {
    client.end();
  }
};

module.exports = {
  connectMQTT,
  publishEvent,
  disconnectMQTT,
};
