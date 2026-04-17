import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Prevent admin from accessing user routes
  if (user?.role === 'admin' && !window.location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />
  }

  return children
}
