const Node = require("../models/node.model");
const formatDateIST = require("../utils/formatDate");

const formatNode = (node) => {
  const data = node.toObject();

  return {
    ...data,

    createdAt: formatDateIST(data.createdAt),
    updatedAt: formatDateIST(data.updatedAt),

    health: {
      ...data.health,
      lastHeartbeatAt: formatDateIST(
        data.health?.lastHeartbeatAt
      ),
    },
  };
};

const getNodes = async (req, res) => {
  try {
    const nodes = await Node.find({
      isActive: true,
    }).sort({
      "location.floor": 1,
      nodeId: 1,
    });

    res.json({
      success: true,
      nodes: nodes.map(formatNode),
    });
  } catch (error) {
    console.error("Get nodes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch nodes",
    });
  }
};

const getNodeById = async (req, res) => {
  try {
    const node = await Node.findOne({
      nodeId: req.params.nodeId,
    });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: "Node not found",
      });
    }

    res.json({
      success: true,
      node: formatNode(node),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch node",
    });
  }
};

module.exports = {
  getNodes,
  getNodeById,
};