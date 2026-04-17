import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Users, Hash } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    role: 'user',
    email: '',
    password: '',
    coordinatorId: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  useEffect(() => {
    const role = searchParams.get('role')
    if (role && ['user', 'staff'].includes(role)) {
      setFormData((prev) => ({ ...prev, role }))
    }
  }, [searchParams])

  const roleOptions = [
    { id: 'user', label: 'Crowd Manager' },
    { id: 'staff', label: 'Coordinator' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    try {
      let payload
      
      if (formData.role === 'user') {
        // Crowd Manager login
        payload = {
          role: formData.role,
          email: formData.email,
          password: formData.password
        }
      } else if (formData.role === 'staff') {
        // Coordinator login
        payload = {
          role: formData.role,
          coordinatorId: formData.coordinatorId
        }
      }
      
      const data = await login(payload)
      if (data.role === 'user') navigate('/dashboard')
      else if (data.role === 'staff') navigate('/staff')
      else navigate('/dashboard')
    } catch (err) {
      // Error handled by store
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Role-based access for operations and crowd view</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.id })}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                      formData.role === role.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>



            {formData.role === 'user' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {formData.role === 'staff' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coordinator ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.coordinatorId}
                      onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value.toUpperCase() })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g., COORD001"
                    />
                  </div>
                </div>

              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Links */}
          <div className="text-center space-y-3">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                Register
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Are you an admin?{' '}
              <Link to="/admin-login" className="text-primary-600 font-semibold hover:text-primary-700">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
