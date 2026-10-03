export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'