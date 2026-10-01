const AuditLog = require("../models/auditLog.model");
const formatDateIST = require("../utils/formatDate");
const {verifyAuditChain} = require("../services/audit.service")

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

// Verify audit hash chain
const verifyAuditLogs = async (req, res) => {
  try {
    const result = await verifyAuditChain();

    res.status(200).json({
      success: true,
      verification: {
        ...result,
        verifiedAt: result.verifiedAt
          ? formatDateIST(result.verifiedAt)
          : null,
      },
    });
  } catch (error) {
    console.error("Audit verification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify audit chain",
    });
  }
};

module.exports = {
  getAuditLogs,
  verifyAuditLogs
};