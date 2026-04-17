import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Menu, X, LogOut, LayoutDashboard, Eye, UserCircle, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Public View', href: '/public', icon: Eye },
  ]

  const authLinks = isAuthenticated
    ? isAdmin
      ? [
          { name: 'Admin Panel', href: '/admin', icon: Shield },
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
      : isStaff
      ? [
          { name: 'Coordinator Portal', href: '/staff', icon: Shield },
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
      : [
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
    : [
        { name: 'Access Portal', href: '/access', icon: UserCircle },
        { name: 'Register', href: '/register', icon: Users },
      ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white font-display tracking-wide">Crowd<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">Intel</span></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-accent-cyan bg-slate-800/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="h-6 w-px bg-slate-800 mx-2" />

            {authLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive(link.href)
                    ? 'text-accent-cyan bg-slate-800/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                <span>{link.name}</span>
              </Link>
            ))}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50"
          >
            <div className="px-4 py-2 space-y-1">
              {[...navLinks, ...authLinks].map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? 'text-accent-cyan bg-slate-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {link.icon && <link.icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                  </div>
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
