import api from './api'
import { USE_MOCK } from './config'
import { mockSOS } from '../mock/sos'

export async function getActiveSOS() {
  if (USE_MOCK) {
    await delay(400)
    return mockSOS
  }
  const res = await api.get('/sos/active')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}