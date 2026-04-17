import { io } from 'socket.io-client'

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const adminSocket = io(`${SOCKET_BASE_URL}/admin`, { autoConnect: false })
export const publicSocket = io(`${SOCKET_BASE_URL}/public`, { autoConnect: false })
export const staffSocket = io(`${SOCKET_BASE_URL}/staff`, { autoConnect: false })
export const crowdSocket = io(`${SOCKET_BASE_URL}/crowd`, { autoConnect: false })

export const joinEventRoom = (socket, eventId) => {
  socket.emit('join_event_room', eventId)
}
