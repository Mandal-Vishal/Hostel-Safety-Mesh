import { mockSocket } from './mockSocket'
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

export async function getAllActiveSOS() {
  if (USE_MOCK) {
    await delay(300)
    return mockSOSState ? [{ ...mockSOSState }] : []
  }
  const res = await api.get('/sos/active/all')
  return res.data
}

export async function acknowledgeSOS(id) {
  if (USE_MOCK) {
    await delay(500)
    if (mockSOSState && mockSOSState.id === id) {
      mockSOSState = { ...mockSOSState, status: 'ACKNOWLEDGED' }
      mockSocket._emit('sos:acknowledged', mockSOSState)
    }
    return { ...mockSOSState }
  }
  const res = await api.post(`/sos/${id}/acknowledge`)
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

export async function updateSOSStatus(id, status) {
  if (USE_MOCK) {
    await delay(500)
    if (mockSOSState && mockSOSState.id === id) {
      mockSOSState = { ...mockSOSState, status }
      mockSocket._emit('sos:acknowledged', mockSOSState) // reusing the same event name for simplicity
    }
    return { ...mockSOSState }
  }
  const res = await api.patch(`/sos/${id}/status`, { status })
  return res.data
}

// dev helper only — lets you manually advance status to test the timeline (removed from real backend flow)
export function _devAdvanceStatus(newStatus) {
  if (mockSOSState) {
    mockSOSState = { ...mockSOSState, status: newStatus }
    mockSocket._emit('sos:acknowledged', mockSOSState) // simplified — real backend would emit distinct events per status
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}