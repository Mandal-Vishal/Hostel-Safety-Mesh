const { publishEvent } = require("./mqtt/mqttClient");

class SimulatedNode {
  constructor(node) {
    this.node = node;

    this.heartbeatTimer = null;

    this.heartbeatEnabled = false;

    this.startTime = Date.now();

    this.batteryLevel = 100;

    this.signalQuality = "GOOD";
  }

  online() {
    publishEvent(this.node, "NODE_ONLINE", {
      health: this.getHealth(),
    });

    this.startHeartbeat();
  }

  startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatEnabled = true;

    this.sendHeartbeat();

    this.heartbeatTimer = setInterval(
      () => {
        if (!this.heartbeatEnabled) {
          return;
        }

        this.sendHeartbeat();
      },
      Number(process.env.HEARTBEAT_INTERVAL) || 10000,
    );
  }

  sendHeartbeat() {
    publishEvent(this.node, "HEARTBEAT", {
      health: this.getHealth(),
    });
  }

  stopHeartbeat() {
    this.heartbeatEnabled = false;

    console.log(`[${this.node.nodeId}] Heartbeat stopped`);
  }

  restartHeartbeat() {
    this.heartbeatEnabled = true;

    console.log(`[${this.node.nodeId}] Heartbeat resumed`);

    this.sendHeartbeat();
  }

  sendSOS() {
    publishEvent(this.node, "SOS");
  }

  sendDuplicateSOS() {
    const event = {
      eventId: require("crypto").randomUUID(),
      eventType: "SOS",
      nodeId: this.node.nodeId,
      name: this.node.name,
      type: this.node.type,
      location: this.node.location,
      timestamp: new Date(),
    };

    const topic = `hostel/nodes/${this.node.nodeId}/events`;

    const mqtt = require("mqtt");

    console.log(`[${this.node.nodeId}] Sending duplicate SOS`);

    // First message
    require("./mqtt/mqttClient").publishEvent(this.node, "SOS");

    // Second message with the SAME eventId
    const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1:1883";

    const publisher = mqtt.connect(brokerUrl);

    publisher.on("connect", () => {
      publisher.publish(topic, JSON.stringify(event), () => {
        console.log(`[${this.node.nodeId}] Duplicate SOS sent`);

        publisher.end();
      });
    });
  }

  simulateDelay(delayMs) {
    console.log(`[${this.node.nodeId}] SOS delayed by ${delayMs}ms`);

    setTimeout(() => {
      this.sendSOS();
    }, delayMs);
  }

  getHealth() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      batteryLevel: this.batteryLevel,
      signalQuality: this.signalQuality,
      uptimeSeconds,
    };
  }
}

class NodeManager {
  constructor(nodes) {
    this.nodes = new Map();

    nodes.forEach((node) => {
      this.nodes.set(node.nodeId, new SimulatedNode(node));
    });
  }

  startAll() {
    for (const node of this.nodes.values()) {
      node.online();
    }
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getAllNodes() {
    return [...this.nodes.values()];
  }

  stopAll() {
    for (const node of this.nodes.values()) {
      node.stopHeartbeat();
    }
  }
}

module.exports = {
  SimulatedNode,
  NodeManager,
};
