import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage')).state?.token
      : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Event APIs
export const eventAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getDashboard: (id) => api.get(`/events/${id}/dashboard`),
  addZone: (id, data) => api.post(`/events/${id}/zones`, data),
  updateZone: (eventId, zoneId, data) => api.put(`/events/${eventId}/zones/${zoneId}`, data),
  deleteZone: (eventId, zoneId) => api.delete(`/events/${eventId}/zones/${zoneId}`),
  assignCoordinator: (eventId, data) => api.post(`/events/${eventId}/assign-coordinator`, data),
  removeCoordinator: (eventId, coordinatorId) => api.delete(`/events/${eventId}/coordinators/${coordinatorId}`)
}

// Crowd Data APIs
export const crowdAPI = {
  update: (eventId, data) => api.post(`/crowd/update/${eventId}`, data),
  getHistory: (eventId, params) => api.get(`/crowd/history/${eventId}`, { params }),
  simulate: (eventId) => api.post(`/crowd/simulate/${eventId}`),
  reset: (eventId) => api.post(`/crowd/reset/${eventId}`)
}

// AI APIs
export const aiAPI = {
  getPredictions: (eventId, params) => api.get(`/ai/predict/${eventId}`, { params }),
  getAnomalies: (eventId) => api.get(`/ai/anomalies/${eventId}`),
  getRecommendations: (eventId) => api.get(`/ai/recommendations/${eventId}`),
  runAnalysis: (eventId) => api.post(`/ai/run-analysis/${eventId}`)
}

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEvents: (params) => api.get('/admin/events', { params }),
  getEventDetails: (id) => api.get(`/admin/events/${id}`),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  activateEmergency: (id, data) => api.post(`/admin/events/${id}/emergency/activate`, data),
  deactivateEmergency: (id) => api.post(`/admin/events/${id}/emergency/deactivate`),
  sendCommand: (id, data) => api.post(`/admin/events/${id}/commands`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getAlerts: (params) => api.get('/admin/alerts', { params }),
  resolveAlert: (id) => api.put(`/admin/alerts/${id}/resolve`)
}

// Staff APIs
export const staffAPI = {
  getEvents: () => api.get('/staff/events'),
  reportIncident: (eventId, data) => api.post(`/staff/events/${eventId}/incidents`, data),
  sendAnswer: (eventId, data) => api.post(`/staff/events/${eventId}/answers`, data)
}

// Seating APIs
export const seatingAPI = {
  getLayout: (eventId) => api.get(`/seating/${eventId}`),
  saveLayout: (eventId, data) => api.put(`/seating/${eventId}`, data),
  updateSeatStatus: (eventId, data) => api.patch(`/seating/${eventId}/seat-status`, data),
  getHistory: (eventId) => api.get(`/seating/${eventId}/history`)
}

// Venue / Geofencing APIs
export const venueAPI = {
  getLayout: () => api.get('/venue/layout'),
  checkGeofence: (data) => api.post('/venue/geofence/check', data),
  getNearestRoute: (data) => api.post('/venue/nearest-route', data)
}

// Venue Plan APIs
export const venuePlanAPI = {
  getByEvent: (eventId) => api.get(`/venue-plan/${eventId}`),
  saveFull: (eventId, data) => api.put(`/venue-plan/${eventId}`, data),
  updateZone: (eventId, zoneId, data) => api.patch(`/venue-plan/${eventId}/zones/${zoneId}`, data)
}

// Operations Feed APIs
export const operationsAPI = {
  getFeed: (eventId) => api.get(`/operations/${eventId}`),
  publish: (eventId, data) => api.post(`/operations/${eventId}`, data)
}

// Public APIs
export const publicAPI = {
  lookupEvent: (accessCode) => api.post('/public/lookup', { accessCode }),
  getEventStatus: (id) => api.get(`/public/event/${id}/status`),
  askQuestion: (id, data) => api.post(`/public/event/${id}/questions`, data)
}

export default api
