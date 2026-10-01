import api from './api'
import { USE_MOCK } from './config'
import { mockDevices } from '../mock/devices'

export async function getDevices() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockDevices]
  }
  const res = await api.get('/devices')
  return res.data
}

export async function getDeviceStatus(id) {
  if (USE_MOCK) {
    await delay(300)
    return mockDevices.find((d) => d.id === id) || null
  }
  const res = await api.get(`/devices/${id}`)
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}