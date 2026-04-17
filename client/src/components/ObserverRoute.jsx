import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ObserverRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!['observer', 'admin'].includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
