const crypto = require("crypto");
const AuditLog = require("../models/auditLog.model");

const createAuditLog = async ({
  action,
  actor,
  entity,
  previousState = null,
  newState = null,
  metadata = {},
}) => {
  try {
    const previousLog = await AuditLog.findOne({})
      .sort({ timestamp: -1, _id: -1 })
      .lean();

    const previousHash = previousLog?.hash || null;

    const timestamp = new Date();

    const auditData = {
      action,

      actor: {
        type: actor?.type || "SYSTEM",
        userId: actor?.userId || null,
        role: actor?.role || null,
      },

      entity: {
        type: entity?.type || null,
        entityId: entity?.entityId || null,
      },

      previousState,
      newState,

      metadata: {
        reason: metadata?.reason || null,
      },

      timestamp,
      previousHash,
    };

    // SHA-256 hash of the current audit record
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(auditData))
      .digest("hex");

    // HMAC signature for integrity verification
    const signature = crypto
      .createHmac(
        "sha256",
        process.env.AUDIT_SECRET
      )
      .update(hash)
      .digest("hex");

    const auditLog = await AuditLog.create({
      ...auditData,
      hash,
      signature,
    });

    return auditLog;
  } catch (error) {
    console.error("Audit log creation error:", error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
};