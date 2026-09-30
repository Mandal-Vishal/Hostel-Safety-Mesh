import api from './api'
import { USE_MOCK } from './config'
import { mockCheckInStatus } from '../mock/checkin'

export async function getCurrentStatus() {
  if (USE_MOCK) {
    await delay(300)
    return mockCheckInStatus
  }
  const res = await api.get('/checkin/status')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}