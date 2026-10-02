const Node = require("../models/node.model");

const formatDateIST = require("../utils/formatDate");

const { sanitizeNode, sanitizeNodes } = require("../utils/privacy");

const formatSafeNode = (node, role) => {
  const data = sanitizeNode(node, role);

  if (!data) {
    return null;
  }

  return {
    ...data,

    createdAt: formatDateIST(data.createdAt),

    updatedAt: formatDateIST(data.updatedAt),

    health: data.health
      ? {
          ...data.health,

          lastHeartbeatAt: formatDateIST(data.health.lastHeartbeatAt),
        }
      : null,
  };
};

const formatSafeNodes = (nodes, role) => {
  return sanitizeNodes(nodes, role).map((node) => ({
    ...node,

    createdAt: formatDateIST(node.createdAt),

    updatedAt: formatDateIST(node.updatedAt),

    health: node.health
      ? {
          ...node.health,

          lastHeartbeatAt: formatDateIST(node.health.lastHeartbeatAt),
        }
      : null,
  }));
};

const getNodes = async (req, res) => {
  try {
    const nodes = await Node.find({
      isActive: true,
    }).sort({
      "location.floor": 1,
      nodeId: 1,
    });

    return res.json({
      success: true,

      nodes: formatSafeNodes(nodes, req.user.role),
    });
  } catch (error) {
    console.error("Get nodes error:", error);

    return res.status(500).json({
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

    return res.json({
      success: true,

      node: formatSafeNode(node, req.user.role),
    });
  } catch (error) {
    console.error("Get node error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch node",
    });
  }
};

module.exports = {
  getNodes,
  getNodeById,
};