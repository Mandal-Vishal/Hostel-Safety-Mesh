const crypto = require("crypto");
const AuditLog = require("../models/auditLog.model");

const createHash = (data) => {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex");
};

const createSignature = (data) => {
  return crypto
    .createHmac(
      "sha256",
      process.env.AUDIT_SECRET
    )
    .update(data)
    .digest("hex");
};

const createAuditLog = async ({
  action,
  actorType,
  actorUserId = null,
  actorRole = null,
  entityType,
  entityId,
  previousState = null,
  newState = null,
  reason = null,
}) => {
  const previousLog = await AuditLog.findOne()
    .sort({ timestamp: -1, _id: -1 })
    .lean();

  const previousHash = previousLog?.hash || null;

  const timestamp = new Date();

  const payload = JSON.stringify({
    action,
    actorType,
    actorUserId: actorUserId?.toString() || null,
    actorRole,
    entityType,
    entityId: entityId.toString(),
    previousState,
    newState,
    reason,
    timestamp: timestamp.toISOString(),
    previousHash,
  });

  const hash = createHash(payload);
  const signature = createSignature(hash);

  return AuditLog.create({
    action,

    actor: {
      type: actorType,
      userId: actorUserId,
      role: actorRole,
    },

    entity: {
      type: entityType,
      entityId,
    },

    previousState,
    newState,

    metadata: {
      reason,
    },

    timestamp,
    previousHash,
    hash,
    signature,
  });
};

module.exports = {
  createAuditLog,
};