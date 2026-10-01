import { useContext, useEffect } from 'react'
import { SocketContext } from '../context/SocketContext'

// subscribes to an event for the lifetime of the component
export function useSocketEvent(event, handler) {
  const socketRef = useContext(SocketContext)

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [event, handler, socketRef])
}

export function useSocket() {
  const socketRef = useContext(SocketContext)
  return socketRef?.current
}