import api from './api'
import { USE_MOCK } from './config'
import { mockUser } from '../mock/user'

export async function login(email, password) {
  if (USE_MOCK) {
    await delay(500)
    if (!email || !password) throw new Error('Email and password are required')
    localStorage.setItem('token', 'mock-token')
    return mockUser
  }
  const res = await api.post('/auth/login', { email, password })
  return res.data.user
}

export async function logout() {
  if (USE_MOCK) {
    localStorage.removeItem('token')
    return
  }
  await api.post('/auth/logout')
}

export async function getCurrentUser() {
  if (USE_MOCK) {
    await delay(300)
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Not authenticated')
    return mockUser
  }
  const res = await api.get('/auth/me')
  return res.data.user
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}