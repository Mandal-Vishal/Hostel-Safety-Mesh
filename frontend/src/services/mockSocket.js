// A tiny pub-sub that mimics socket.on/socket.emit for mock mode
const listeners = {}

export const mockSocket = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(callback)
  },
  off(event, callback) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter((cb) => cb !== callback)
  },
  // used internally by mock services to simulate the backend firing an event
  _emit(event, data) {
    if (!listeners[event]) return
    listeners[event].forEach((cb) => cb(data))
  },
}