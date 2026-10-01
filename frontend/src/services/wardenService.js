import api from './api'
import { USE_MOCK } from './config'
import { mockWardenStats } from '../mock/wardenStats'

export async function getStats() {
  if (USE_MOCK) {
    await delay(400)
    return { ...mockWardenStats }
  }
  const res = await api.get('/warden/stats')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}