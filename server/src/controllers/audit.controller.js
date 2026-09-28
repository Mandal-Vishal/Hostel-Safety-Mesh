const AuditLog = require("../models/auditLog.model");
const formatDateIST = require("../utils/formatDate");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate(
        "actor.userId",
        "firstName lastName email role"
      )
      .sort({ timestamp: -1 })
      .limit(200);

    const formattedLogs = logs.map((log) => {
      const data = log.toObject();

      return {
        ...data,
        timestamp: formatDateIST(data.timestamp),
      };
    });

    res.json({
      success: true,
      logs: formattedLogs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

module.exports = {
  getAuditLogs,
};