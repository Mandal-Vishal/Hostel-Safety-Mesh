import api from './api'
import { USE_MOCK } from './config'

import {
  mockZoneSummary,
  mockPendingResidents,
} from '../mock/pendingCheckins'

let mockState = {
  checkedIn: false,
  checkedInAt: null,
  zone: 'Block A • Floor 2',
  withinPeriod: true,
  periodStart: '9:00 PM',
  periodEnd: '11:30 PM',
}

function formatZone(location) {
  if (!location) return 'Unassigned'

  const parts = []

  if (location.building) {
    parts.push(location.building)
  }

  if (location.floor !== null && location.floor !== undefined) {
    parts.push(`Floor ${location.floor}`)
  }

  if (location.zone) {
    parts.push(location.zone)
  }

  return parts.join(' • ') || 'Unassigned'
}

function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date())
}

function getDateKeyFromISTString(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)

  if (!match) {
    return null
  }

  const [, day, month, year] = match

  return `${year}-${month}-${day}`
}

function normalizeMyCheckIn(checkIn) {
  return {
    id: checkIn.id,
    status: checkIn.status,
    checkedIn: checkIn.status === 'CHECKED_IN',
    checkedInAt: checkIn.checkedInAt,
    scheduledAt: checkIn.scheduledAt,
    zone: 'Your registered zone',
    withinPeriod: null,
    periodStart: null,
    periodEnd: null,
    source: checkIn.source?.type || null,
  }
}

export async function getCurrentStatus() {
  if (USE_MOCK) {
    await delay(300)
    return { ...mockState }
  }

  const res = await api.get('/checkins/my')

  const checkIns = res.data.checkIns || []
  const todayKey = getTodayKey()

  const current = checkIns.find(
    (item) => getDateKeyFromISTString(item.scheduledAt) === todayKey,
  )

  if (!current) {
    return {
      checkedIn: false,
      checkedInAt: null,
      scheduledAt: null,
      status: 'EXPECTED',
      withinPeriod: null,
      periodStart: null,
      periodEnd: null,
      source: null,
    }
  }

  return normalizeMyCheckIn(current)
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
      checkedInAt: now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    return { ...mockState }
  }

  try {
    const res = await api.post('/checkins')

    return normalizeMyCheckIn(res.data.checkIn)
  } catch (error) {
    const message = error.response?.data?.message || ''

    if (error.response?.status === 409) {
      throw new Error('ALREADY_CHECKED_IN')
    }

    if (
      error.response?.status === 400 &&
      message.toLowerCase().includes('allowed between')
    ) {
      throw new Error('OUTSIDE_PERIOD')
    }

    throw error
  }
}

export async function getPendingSummary() {
  if (USE_MOCK) {
    await delay(300)
    return [...mockZoneSummary]
  }

  const res = await api.get('/checkins', {
    params: { status: 'EXPECTED' },
  })

  const checkIns = res.data.checkIns || []
  const grouped = new Map()

  for (const item of checkIns) {
    const residentLocation =
      item.resident?.currentZone ||
      item.resident?.hostel ||
      item.zone ||
      null

    const zone = formatZone(residentLocation)

    const existing = grouped.get(zone) || {
      zone,
      expected: 0,
      checkedIn: 0,
      pending: 0,
    }

    existing.expected += 1
    existing.pending += item.status === 'EXPECTED' ? 1 : 0

    grouped.set(zone, existing)
  }

  return Array.from(grouped.values())
}

export async function getPendingResidents(zone) {
  if (USE_MOCK) {
    await delay(300)

    return zone
      ? mockPendingResidents.filter((r) => r.zone.startsWith(zone))
      : [...mockPendingResidents]
  }

  const res = await api.get('/checkins', {
    params: { status: 'EXPECTED' },
  })

  const checkIns = res.data.checkIns || []

  return checkIns
    .map((item) => {
      const location =
        item.resident?.currentZone ||
        item.resident?.hostel ||
        item.zone ||
        null

      return {
        id:
          item.resident?.id ||
          item.resident?.email ||
          item.id,
        name:
          [item.resident?.firstName, item.resident?.lastName]
            .filter(Boolean)
            .join(' ') || 'Resident',
        zone: formatZone(location),
        status: item.status,
      }
    })
    .filter((resident) => !zone || resident.zone === zone)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}