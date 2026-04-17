import { io } from 'socket.io-client'

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function createCrowdSocket() {
  return io(SOCKET_BASE_URL, {
    transports: ['websocket', 'polling'],
  })
}
