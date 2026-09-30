import api from './api'
import { USE_MOCK } from './config'

// mutable mock state so we can simulate a real check-in during dev
let mockState = {
  checkedIn: false,
  checkedInAt: null,
  zone: 'Block A • Floor 2',
  withinPeriod: true, // flip to false to test the "outside period" state
  periodStart: '9:00 PM',
  periodEnd: '11:30 PM',
}

export async function getCurrentStatus() {
  if (USE_MOCK) {
    await delay(300)
    return { ...mockState }
  }
  const res = await api.get('/checkin/status')
  return res.data
}

export async function checkIn() {
  if (USE_MOCK) {
    await delay(700)
    if (!mockState.withinPeriod) {
      throw new Error('OUTSIDE_PERIOD')
    }
    if (mockState.checkedIn) {
      throw new Error('ALREADY_CHECKED_IN')
    }
    const now = new Date()
    mockState = {
      ...mockState,
      checkedIn: true,
      checkedInAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    return { ...mockState }
  }
  const res = await api.post('/checkin')
  return res.data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}