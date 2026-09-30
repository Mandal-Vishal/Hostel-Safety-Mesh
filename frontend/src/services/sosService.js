import api from './api'
import { USE_MOCK } from './config'

let mockSOSState = null // null = no active SOS

export async function getActiveSOS() {
  if (USE_MOCK) {
    await delay(300)
    return mockSOSState ? { ...mockSOSState } : null
  }
  const res = await api.get('/sos/active')
  return res.data
}

export async function createSOS() {
  if (USE_MOCK) {
    await delay(600)
    const now = new Date()
    mockSOSState = {
      id: 'SOS-1024',
      status: 'TRIGGERED',
      zone: 'Block A • Floor 2',
      triggeredAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    return { ...mockSOSState }
  }
  const res = await api.post('/sos')
  return res.data
}

export async function getSOSDetails(id) {
  if (USE_MOCK) {
    await delay(300)
    return mockSOSState ? { ...mockSOSState } : null
  }
  const res = await api.get(`/sos/${id}`)
  return res.data
}

// dev helper only — lets you manually advance status to test the timeline (removed from real backend flow)
export function _devAdvanceStatus(newStatus) {
  if (mockSOSState) mockSOSState = { ...mockSOSState, status: newStatus }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}