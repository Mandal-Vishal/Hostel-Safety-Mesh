import api from './api'
import { USE_MOCK } from './config'
import { mockNotifications } from '../mock/notifications'

let mockState = [...mockNotifications]

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