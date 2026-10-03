import api from './api'
import { USE_MOCK } from './config'
import { mockAuditLogs } from '../mock/auditLogs'

export async function getAuditLogs() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockAuditLogs]
  }
  const res = await api.get('/audit-logs')
  return res.data
}

export async function getAuditLogDetails(id) {
  if (USE_MOCK) {
    await delay(300)
    return mockAuditLogs.find((l) => l.id === id) || null
  }
  const res = await api.get(`/audit-logs/${id}`)
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}