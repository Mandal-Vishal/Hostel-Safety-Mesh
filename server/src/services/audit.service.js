const crypto = require("crypto");
const AuditLog = require("../models/auditLog.model");

/*
 * Convert MongoDB/JS values into deterministic plain values.
 * This prevents Date/ObjectId/property-order differences from
 * producing different hashes.
 */
const normalizeForHash = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value._bsontype === "ObjectId"
  ) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForHash);
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalizeForHash(value[key]);
        return result;
      }, {});
  }

  return value;
};

const buildHashPayload = ({
  action,
  actor,
  entity,
  previousState,
  newState,
  metadata,
  timestamp,
  previousHash,
}) => {
  return normalizeForHash({
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

    previousState: previousState ?? null,
    newState: newState ?? null,
    metadata: metadata ?? {},
    timestamp,
    previousHash: previousHash || null,
  });
};

const calculateHash = (payload) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};

const calculateSignature = (hash) => {
  if (!process.env.AUDIT_SECRET) {
    throw new Error("AUDIT_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", process.env.AUDIT_SECRET)
    .update(hash)
    .digest("hex");
};

const createAuditLog = async ({
  action,
  actor,
  entity,
  previousState = null,
  newState = null,
  metadata = {},
}) => {
  try {
    if (!entity?.type) {
      throw new Error("AuditLog entity.type is required");
    }

    if (!entity?.entityId) {
      throw new Error("AuditLog entity.entityId is required");
    }

    const previousLog = await AuditLog.findOne({})
      .sort({ timestamp: -1, _id: -1 })
      .lean();

    const previousHash = previousLog?.hash || null;
    const timestamp = new Date();

    const hashPayload = buildHashPayload({
      action,
      actor,
      entity,
      previousState,
      newState,
      metadata,
      timestamp,
      previousHash,
    });

    const hash = calculateHash(hashPayload);
    const signature = calculateSignature(hash);

    const auditLog = await AuditLog.create({
      action,

      actor: {
        type: actor?.type || "SYSTEM",
        userId: actor?.userId || null,
        role: actor?.role || null,
      },

      entity: {
        type: entity.type,
        entityId: entity.entityId,
      },

      previousState,
      newState,
      metadata,
      timestamp,
      previousHash,
      hash,
      signature,
    });

    return auditLog;
  } catch (error) {
    console.error("Audit log creation error:", error);
    throw error;
  }
};

const verifyAuditChain = async () => {
  const logs = await AuditLog.find({})
    .sort({ timestamp: 1, _id: 1 })
    .lean();

  let expectedPreviousHash = null;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Check chain linkage
    if ((log.previousHash || null) !== expectedPreviousHash) {
      return {
        valid: false,
        reason: "Audit chain link is broken",
        brokenAt: log._id.toString(),
        index: i,
        totalLogs: logs.length,
        verifiedAt: null,
      };
    }

    // Reconstruct the exact canonical payload
    const hashPayload = buildHashPayload({
      action: log.action,
      actor: log.actor,
      entity: log.entity,
      previousState: log.previousState,
      newState: log.newState,
      metadata: log.metadata,
      timestamp: log.timestamp,
      previousHash: log.previousHash,
    });

    const calculatedHash = calculateHash(hashPayload);

    if (log.hash !== calculatedHash) {
      return {
        valid: false,
        reason: "Audit log hash mismatch",
        brokenAt: log._id.toString(),
        index: i,
        totalLogs: logs.length,
        verifiedAt: null,
      };
    }

    const calculatedSignature =
      calculateSignature(calculatedHash);

    if (log.signature !== calculatedSignature) {
      return {
        valid: false,
        reason: "Audit log signature mismatch",
        brokenAt: log._id.toString(),
        index: i,
        totalLogs: logs.length,
        verifiedAt: null,
      };
    }

    expectedPreviousHash = log.hash;
  }

  return {
    valid: true,
    totalLogs: logs.length,
    verifiedAt: new Date(),
  };
};

module.exports = {
  createAuditLog,
  verifyAuditChain,
};