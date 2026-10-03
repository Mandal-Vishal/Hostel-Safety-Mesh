import api from './api'
import { USE_MOCK } from './config'
import { mockAnalytics } from '../mock/analytics'

export async function getAnalytics(days = 7) {
  if (USE_MOCK) {
    await delay(400)
    return { ...mockAnalytics }
  }

  const res = await api.get('/analytics', {
    params: { days },
  })

  return res.data.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}