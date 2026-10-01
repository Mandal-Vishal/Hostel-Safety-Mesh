import api from './api'
import { USE_MOCK } from './config'

let mockIncidents = [
  { id: 'INC-1024', type: 'Noise / disturbance', zone: 'Block A • Floor 2', status: 'RESOLVED', date: 'September 27' },
]

export async function createIncident(data) {
  if (USE_MOCK) {
    await delay(500)
    const newIncident = {
      id: `INC-${1000 + mockIncidents.length + 1}`,
      type: data.type,
      zone: data.zone,
      status: 'OPEN',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      description: data.description,
      anonymous: data.anonymous,
    }
    mockIncidents = [newIncident, ...mockIncidents]
    return newIncident
  }
  const res = await api.post('/incidents', data)
  return res.data
}

export async function getIncidents() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockIncidents]
  }
  const res = await api.get('/incidents')
  return res.data
}

export async function getIncidentDetails(id) {
  if (USE_MOCK) {
    await delay(300)
    return mockIncidents.find((i) => i.id === id) || null
  }
  const res = await api.get(`/incidents/${id}`)
  return res.data
}

export async function updateIncident(id, updates) {
  if (USE_MOCK) {
    await delay(400)
    mockIncidents = mockIncidents.map((i) => (i.id === id ? { ...i, ...updates } : i))
    return mockIncidents.find((i) => i.id === id)
  }
  const res = await api.patch(`/incidents/${id}`, updates)
  return res.data
}

// mock-only helper: a fixed timeline for demo purposes
export function getMockTimeline(incident) {
  const base = [{ label: 'Incident reported', time: incident.date }]
  if (incident.status !== 'OPEN') {
    base.push({ label: 'Warden assigned', time: incident.date })
  }
  if (incident.status === 'INVESTIGATING' || incident.status === 'RESOLVED') {
    base.push({ label: 'Investigation started', time: incident.date })
  }
  if (incident.status === 'RESOLVED') {
    base.push({ label: 'Marked resolved', time: incident.date })
  }
  return base
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}