import api from './api'
import { USE_MOCK } from './config'
import { mockAdminStats, mockUsers, mockZones } from '../mock/adminStats'

export async function getAdminStats() {
  if (USE_MOCK) {
    await delay(400)
    return { ...mockAdminStats }
  }
  const res = await api.get('/admin/stats')
  return res.data
}

export async function getUsers() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockUsers]
  }
  const res = await api.get('/admin/users')
  return res.data
}

export async function getZones() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockZones]
  }
  const res = await api.get('/admin/zones')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}