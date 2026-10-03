import api from "./api";
import { USE_MOCK } from "./config";
import { mockAuditLogs } from "../mock/auditLogs";

function normalizeAuditLog(log) {
  return {
    ...log,

    id: log.id || log._id || null,

    actor: log.actor?.name || log.actor?.role || log.actor || "SYSTEM",

    actorRole: log.actor?.role || "SYSTEM",

    action: log.action || "UNKNOWN",

    resource:
      log.entity?.type && log.entity?.entityId
        ? `${log.entity.type} • ${log.entity.entityId}`
        : log.resource || log.entity?.type || "Unknown",

    previousState: log.previousState || null,

    newState: log.newState || null,

    timestamp: log.timestamp || null,

    hash: log.hash || null,

    previousHash: log.previousHash || null,

    signature: log.signature || null,

    verified: log.verified ?? true,
  };
}

export async function getAuditLogs() {
  if (USE_MOCK) {
    await delay(300);

    return mockAuditLogs.map(normalizeAuditLog);
  }

  const res = await api.get("/audits");

  return (res.data.logs || []).map(normalizeAuditLog);
}

export async function getAuditLogDetails(id) {
  if (USE_MOCK) {
    await delay(300);

    const log = mockAuditLogs.find((item) => item.id === id);

    return log ? normalizeAuditLog(log) : null;
  }

  /**
   * The backend currently exposes:
   *
   * GET /api/audits
   * GET /api/audits/verify
   *
   * It does not expose /api/audits/:id.
   *
   * Therefore fetch the available audit list and
   * select the requested record client-side.
   */
  const res = await api.get("/audits");

  const logs = (res.data.logs || []).map(normalizeAuditLog);

  return logs.find((log) => String(log.id) === String(id)) || null;
}

export async function verifyAuditChain() {
  if (USE_MOCK) {
    await delay(300);

    return {
      valid: true,
      totalLogs: mockAuditLogs.length,
      verifiedAt: new Date().toISOString(),
    };
  }

  const res = await api.get("/audits/verify");

  return res.data.verification;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
