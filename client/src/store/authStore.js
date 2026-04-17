import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

axios.defaults.baseURL = API_URL

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initializeAuth: () => {
        const token = get().token
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },

      login: async (email, password, isAdmin = false) => {
        set({ isLoading: true, error: null })
        try {
          const endpoint = isAdmin ? '/auth/admin-login' : '/auth/login'
          const { data } = await axios.post(endpoint, { email, password })
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          set({
            user: data,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          })
          throw error
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await axios.post('/auth/register', {
            name,
            email,
            password
          })
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          set({
            user: data,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false
          })
          throw error
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
