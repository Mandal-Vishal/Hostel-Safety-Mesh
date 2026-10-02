import api from './api'
import { USE_MOCK } from './config'

let mockState = [...(await import('../mock/notifications')).mockNotifications]

export async function getNotifications() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockState]
  }
  const res = await api.get('/notifications')
  return res.data
}

export async function markAsRead(id) {
  if (USE_MOCK) {
    await delay(200)
    mockState = mockState.map((n) => (n.id === id ? { ...n, read: true } : n))
    return mockState
  }
  const res = await api.patch(`/notifications/${id}/read`)
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}