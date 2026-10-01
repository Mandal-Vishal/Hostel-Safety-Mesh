import { createContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { USE_MOCK, SOCKET_URL } from '../services/config'
import { mockSocket } from '../services/mockSocket'
import { useAuth } from '../hooks/useAuth'

export const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) return

    if (USE_MOCK) {
      socketRef.current = mockSocket
    } else {
      socketRef.current = io(SOCKET_URL, { withCredentials: true })
    }

    return () => {
      if (!USE_MOCK && socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  )
}