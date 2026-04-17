import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AccessPortal from './pages/AccessPortal'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import PublicView from './pages/PublicView'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import StaffRoute from './components/StaffRoute'
import CrowdRoute from './components/CrowdRoute'
import ObserverRoute from './components/ObserverRoute'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

function App() {
  const initializeAuth = useAuthStore(state => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/access" element={<AccessPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/public" element={<PublicView />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/events/create" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Staff Routes */}
          <Route path="/staff" element={
            <StaffRoute>
              <StaffDashboard />
            </StaffRoute>
          } />

          {/* Crowd Routes */}
          <Route path="/crowd" element={
            <CrowdRoute>
              <PublicView />
            </CrowdRoute>
          } />

          {/* Observer Routes */}
          <Route path="/observer" element={
            <ObserverRoute>
              <PublicView />
            </ObserverRoute>
          } />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
