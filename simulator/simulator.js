require("dotenv").config();

const readline = require("readline");

const nodes = require("./config/nodes");

const {
  connectMQTT,
  disconnectMQTT,
} = require("./mqtt/mqttClient");

const {
  NodeManager,
} = require("./nodeManager");

const nodeManager = new NodeManager(nodes);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Show simulator menu
const showMenu = () => {
  console.log(`
========================================
        HOSTEL IoT SIMULATOR
========================================

1. List nodes
2. Send SOS
3. Stop heartbeat
4. Restart heartbeat
5. Duplicate SOS
6. Delayed SOS
7. Exit

========================================
`);
};

// Ask user for menu option
const ask = () => {
  rl.question("Select option: ", handleCommand);
};

// Handle menu option
const handleCommand = (answer) => {
  const choice = answer.trim();

  switch (choice) {
    // List nodes
    case "1": {
      console.log("\nNodes:");

      nodeManager
        .getAllNodes()
        .forEach((node) => {
          console.log(
            `${node.node.nodeId} → ` +
              `Floor ${node.node.location.floor} → ` +
              `${node.node.location.zone}`
          );
        });

      showMenu();
      ask();
      break;
    }

    // Send SOS
    case "2": {
      rl.question("Node ID: ", (nodeId) => {
        const node = nodeManager.getNode(nodeId.trim());

        if (!node) {
          console.log("Node not found");
        } else {
          node.sendSOS();
        }

        showMenu();
        ask();
      });

      break;
    }

    // Stop heartbeat
    case "3": {
      rl.question("Node ID: ", (nodeId) => {
        const node = nodeManager.getNode(nodeId.trim());

        if (!node) {
          console.log("Node not found");
        } else {
          node.stopHeartbeat();
        }

        showMenu();
        ask();
      });

      break;
    }

    // Restart heartbeat
    case "4": {
      rl.question("Node ID: ", (nodeId) => {
        const node = nodeManager.getNode(nodeId.trim());

        if (!node) {
          console.log("Node not found");
        } else {
          node.restartHeartbeat();
        }

        showMenu();
        ask();
      });

      break;
    }

    // Duplicate SOS
    case "5": {
      rl.question("Node ID: ", (nodeId) => {
        const node = nodeManager.getNode(nodeId.trim());

        if (!node) {
          console.log("Node not found");
        } else {
          node.sendDuplicateSOS();
        }

        showMenu();
        ask();
      });

      break;
    }

    // Delayed SOS
    case "6": {
      rl.question("Node ID: ", (nodeId) => {
        const node = nodeManager.getNode(nodeId.trim());

        if (!node) {
          console.log("Node not found");
          showMenu();
          ask();
          return;
        }

        rl.question(
          "Delay in milliseconds: ",
          (delay) => {
            const delayMs = Number(delay);

            if (
              Number.isNaN(delayMs) ||
              delayMs < 0
            ) {
              console.log("Invalid delay");
              showMenu();
              ask();
              return;
            }

            node.simulateDelay(delayMs);

            showMenu();
            ask();
          }
        );
      });

      break;
    }

    // Exit
    case "7": {
      console.log("\nStopping simulator...");

      nodeManager.stopAll();
      disconnectMQTT();

      rl.close();

      break;
    }

    // Invalid option
    default: {
      console.log("Invalid option");
      showMenu();
      ask();
    }
  }
};

// Start simulator
connectMQTT();

setTimeout(() => {
  nodeManager.startAll();

  showMenu();
  ask();
}, 1000);