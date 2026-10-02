import api from './api'
import { USE_MOCK } from './config'
import { mockAnalytics } from '../mock/analytics'

export async function getAnalytics() {
  if (USE_MOCK) {
    await delay(400)
    return { ...mockAnalytics }
  }
  const res = await api.get('/analytics')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}