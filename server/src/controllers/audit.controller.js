const AuditLog = require("../models/auditLog.model");

const formatDateIST = require("../utils/formatDate");

const { sanitizeAuditLog, sanitizeAuditLogs } = require("../utils/privacy");

const { verifyAuditChain } = require("../services/audit.service");

const formatSafeAuditLog = (log) => {
  const data = sanitizeAuditLog(log);

  if (!data) {
    return null;
  }

  return {
    ...data,

    timestamp: formatDateIST(data.timestamp),
  };
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("actor.userId", "firstName lastName role")
      .sort({
        timestamp: -1,
      })
      .limit(200);

    return res.json({
      success: true,

      logs: sanitizeAuditLogs(logs).map((log) => ({
        ...log,

        timestamp: formatDateIST(log.timestamp),
      })),
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

const verifyAuditLogs = async (req, res) => {
  try {
    const result = await verifyAuditChain();

    return res.status(200).json({
      success: true,

      verification: {
        ...result,

        verifiedAt: result.verifiedAt ? formatDateIST(result.verifiedAt) : null,
      },
    });
  } catch (error) {
    console.error("Audit verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify audit chain",
    });
  }
};

module.exports = {
  getAuditLogs,
  verifyAuditLogs,
};