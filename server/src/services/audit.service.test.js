const crypto = require("crypto");

jest.mock("../models/auditLog.model", () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
}));

const AuditLog = require("../models/auditLog.model");

const { createAuditLog, verifyAuditChain } = require("./audit.service");

const createQueryMock = (result) => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };

  return query;
};

describe("Audit Service", () => {
  const originalAuditSecret = process.env.AUDIT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.AUDIT_SECRET = "test-audit-secret";

    AuditLog.findOne.mockReturnValue(createQueryMock(null));
  });

  afterAll(() => {
    if (originalAuditSecret === undefined) {
      delete process.env.AUDIT_SECRET;
    } else {
      process.env.AUDIT_SECRET = originalAuditSecret;
    }
  });

  test("creates an audit log with the expected security fields", async () => {
    const createdAuditLog = {
      _id: "audit-123",
      action: "SOS_CREATED",
      actor: {
        type: "USER",
        userId: "user-123",
        role: "resident",
      },
      entity: {
        type: "INCIDENT",
        entityId: "incident-123",
      },
      previousState: null,
      newState: "PENDING",
      metadata: {
        reason: "Resident triggered SOS",
      },
      timestamp: new Date(),
      previousHash: null,
      hash: "generated-hash",
      signature: "generated-signature",
    };

    AuditLog.create.mockResolvedValue(createdAuditLog);

    const result = await createAuditLog({
      action: "SOS_CREATED",

      actor: {
        type: "USER",
        userId: "user-123",
        role: "resident",
      },

      entity: {
        type: "INCIDENT",
        entityId: "incident-123",
      },

      previousState: null,

      newState: "PENDING",

      metadata: {
        reason: "Resident triggered SOS",
      },
    });

    expect(AuditLog.findOne).toHaveBeenCalledTimes(1);

    expect(AuditLog.create).toHaveBeenCalledTimes(1);

    expect(result).toBe(createdAuditLog);

    const createPayload = AuditLog.create.mock.calls[0][0];

    expect(createPayload.action).toBe("SOS_CREATED");

    expect(createPayload.actor).toEqual({
      type: "USER",
      userId: "user-123",
      role: "resident",
    });

    expect(createPayload.entity).toEqual({
      type: "INCIDENT",
      entityId: "incident-123",
    });

    expect(createPayload.previousState).toBeNull();

    expect(createPayload.newState).toBe("PENDING");

    expect(createPayload.metadata).toEqual({
      reason: "Resident triggered SOS",
    });

    expect(createPayload.timestamp).toBeInstanceOf(Date);

    expect(createPayload.previousHash).toBeNull();

    expect(createPayload.hash).toEqual(expect.any(String));

    expect(createPayload.signature).toEqual(expect.any(String));
  });

  test("uses the previous audit hash when creating the next audit entry", async () => {
    const previousLog = {
      hash: "previous-hash",
    };

    AuditLog.findOne.mockReturnValue(createQueryMock(previousLog));

    AuditLog.create.mockResolvedValue({
      _id: "audit-124",
    });

    await createAuditLog({
      action: "INCIDENT_ACKNOWLEDGED",

      actor: {
        type: "USER",
        userId: "warden-123",
        role: "warden",
      },

      entity: {
        type: "INCIDENT",
        entityId: "incident-123",
      },

      previousState: "PENDING",

      newState: "ACKNOWLEDGED",

      metadata: {
        reason: "Warden acknowledged incident",
      },
    });

    const createPayload = AuditLog.create.mock.calls[0][0];

    expect(createPayload.previousHash).toBe("previous-hash");
  });

  test("fails when audit entity type is missing", async () => {
    await expect(
      createAuditLog({
        action: "TEST_ACTION",

        actor: {
          type: "SYSTEM",
        },

        entity: {
          entityId: "entity-123",
        },
      }),
    ).rejects.toThrow("AuditLog entity.type is required");

    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  test("fails when audit entity id is missing", async () => {
    await expect(
      createAuditLog({
        action: "TEST_ACTION",

        actor: {
          type: "SYSTEM",
        },

        entity: {
          type: "INCIDENT",
        },
      }),
    ).rejects.toThrow("AuditLog entity.entityId is required");

    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  test("fails when AUDIT_SECRET is missing", async () => {
    delete process.env.AUDIT_SECRET;

    await expect(
      createAuditLog({
        action: "TEST_ACTION",

        actor: {
          type: "SYSTEM",
        },

        entity: {
          type: "INCIDENT",
          entityId: "incident-123",
        },
      }),
    ).rejects.toThrow("AUDIT_SECRET is not configured");

    expect(AuditLog.create).not.toHaveBeenCalled();
  });

  test("verifies an empty audit chain as valid", async () => {
    AuditLog.find.mockReturnValue(createQueryMock([]));

    const result = await verifyAuditChain();

    expect(result.valid).toBe(true);

    expect(result.totalLogs).toBe(0);

    expect(result.verifiedAt).toBeInstanceOf(Date);
  });

  test("verifies a valid single-entry audit chain", async () => {
    const timestamp = new Date("2026-10-03T06:30:00.000Z");

    const actor = {
      type: "SYSTEM",
      userId: null,
      role: "SYSTEM",
    };

    const entity = {
      type: "NODE",
      entityId: "node-123",
    };

    const metadata = {
      reason: "Heartbeat timeout",
    };

    /**
     * Reconstruct the exact normalization/hash
     * logic used by audit.service.js.
     */
    const normalizeForHash = (value) => {
      if (value === null || value === undefined) {
        return null;
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "object" && value._bsontype === "ObjectId") {
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

    const payload = normalizeForHash({
      action: "NODE_OFFLINE",

      actor,

      entity,

      previousState: "ONLINE",

      newState: "OFFLINE",

      metadata,

      timestamp,

      previousHash: null,
    });

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const signature = crypto
      .createHmac("sha256", process.env.AUDIT_SECRET)
      .update(hash)
      .digest("hex");

    const log = {
      _id: "audit-123",

      action: "NODE_OFFLINE",

      actor,

      entity,

      previousState: "ONLINE",

      newState: "OFFLINE",

      metadata,

      timestamp,

      previousHash: null,

      hash,

      signature,
    };

    AuditLog.find.mockReturnValue(createQueryMock([log]));

    const result = await verifyAuditChain();

    expect(result.valid).toBe(true);

    expect(result.totalLogs).toBe(1);

    expect(result.verifiedAt).toBeInstanceOf(Date);
  });

  test("detects a broken audit chain link", async () => {
    const timestamp1 = new Date("2026-10-03T06:00:00.000Z");

    const timestamp2 = new Date("2026-10-03T06:01:00.000Z");

    const actor = {
      type: "SYSTEM",
      userId: null,
      role: "SYSTEM",
    };

    const entity = {
      type: "INCIDENT",
      entityId: "incident-1",
    };

    /**
     * Reproduce the same canonicalization used by
     * audit.service.js so the first record is valid.
     */
    const normalizeForHash = (value) => {
      if (value === null || value === undefined) {
        return null;
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "object" && value._bsontype === "ObjectId") {
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

    const firstPayload = normalizeForHash({
      action: "SOS_CREATED",

      actor,

      entity,

      previousState: null,

      newState: "PENDING",

      metadata: {},

      timestamp: timestamp1,

      previousHash: null,
    });

    const firstHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(firstPayload))
      .digest("hex");

    const firstSignature = crypto
      .createHmac("sha256", process.env.AUDIT_SECRET)
      .update(firstHash)
      .digest("hex");

    const logs = [
      {
        _id: "audit-1",

        action: "SOS_CREATED",

        actor,

        entity,

        previousState: null,

        newState: "PENDING",

        metadata: {},

        timestamp: timestamp1,

        previousHash: null,

        /**
         * Valid first record.
         */
        hash: firstHash,

        signature: firstSignature,
      },

      {
        _id: "audit-2",

        action: "INCIDENT_ACKNOWLEDGED",

        actor,

        entity,

        previousState: "PENDING",

        newState: "ACKNOWLEDGED",

        metadata: {},

        timestamp: timestamp2,

        /**
         * Deliberately incorrect.
         *
         * This is what makes the chain broken.
         */
        previousHash: "wrong-hash",

        hash: "hash-2",

        signature: "signature-2",
      },
    ];

    AuditLog.find.mockReturnValue(createQueryMock(logs));

    const result = await verifyAuditChain();

    expect(result.valid).toBe(false);

    expect(result.reason).toBe("Audit chain link is broken");

    expect(result.brokenAt).toBe("audit-2");

    expect(result.index).toBe(1);

    expect(result.totalLogs).toBe(2);

    expect(result.verifiedAt).toBeNull();
  });

  test("detects an audit hash mismatch", async () => {
    const log = {
      _id: "audit-123",

      action: "SOS_CREATED",

      actor: {
        type: "SYSTEM",
        userId: null,
        role: "SYSTEM",
      },

      entity: {
        type: "INCIDENT",
        entityId: "incident-123",
      },

      previousState: null,

      newState: "PENDING",

      metadata: {},

      timestamp: new Date("2026-10-03T06:00:00.000Z"),

      previousHash: null,

      hash: "tampered-hash",

      signature: "some-signature",
    };

    AuditLog.find.mockReturnValue(createQueryMock([log]));

    const result = await verifyAuditChain();

    expect(result.valid).toBe(false);

    expect(result.reason).toBe("Audit log hash mismatch");

    expect(result.brokenAt).toBe("audit-123");

    expect(result.index).toBe(0);

    expect(result.verifiedAt).toBeNull();
  });

  test("detects an audit signature mismatch", async () => {
    const timestamp = new Date("2026-10-03T06:30:00.000Z");

    const actor = {
      type: "SYSTEM",
      userId: null,
      role: "SYSTEM",
    };

    const entity = {
      type: "NODE",
      entityId: "node-123",
    };

    const metadata = {};

    const normalizeForHash = (value) => {
      if (value === null || value === undefined) {
        return null;
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "object" && value._bsontype === "ObjectId") {
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

    const payload = normalizeForHash({
      action: "NODE_OFFLINE",

      actor,

      entity,

      previousState: "ONLINE",

      newState: "OFFLINE",

      metadata,

      timestamp,

      previousHash: null,
    });

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    const log = {
      _id: "audit-123",

      action: "NODE_OFFLINE",

      actor,

      entity,

      previousState: "ONLINE",

      newState: "OFFLINE",

      metadata,

      timestamp,

      previousHash: null,

      hash,

      /**
       * Deliberately incorrect signature.
       */
      signature: "invalid-signature",
    };

    AuditLog.find.mockReturnValue(createQueryMock([log]));

    const result = await verifyAuditChain();

    expect(result.valid).toBe(false);

    expect(result.reason).toBe("Audit log signature mismatch");

    expect(result.brokenAt).toBe("audit-123");

    expect(result.index).toBe(0);

    expect(result.verifiedAt).toBeNull();
  });
});
