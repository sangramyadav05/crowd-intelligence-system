import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function StaffRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'staff' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
