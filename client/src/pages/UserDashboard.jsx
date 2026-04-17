import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, Users, MapPin, ArrowRight, Activity, AlertCircle, TrendingUp } from 'lucide-react'
import { eventAPI } from '../lib/api'

export default function UserDashboard() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalCrowd: 0,
    alerts: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data } = await eventAPI.getAll()
      setEvents(data)
      
      // Calculate stats
      const now = new Date()
      const active = data.filter(e => new Date(e.startTime) <= now && new Date(e.endTime) >= now)
      const totalCrowd = data.reduce((sum, e) => sum + (e.zones?.reduce((z, zone) => z + (zone.currentCount || 0), 0) || 0), 0)
      
      setStats({
        totalEvents: data.length,
        activeEvents: active.length,
        totalCrowd,
        alerts: active.reduce((sum, e) => sum + (e.zones?.filter(z => z.currentCount > z.capacity * 0.8).length || 0), 0)
      })
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    if (now < start) return 'bg-blue-100 text-blue-800'
    if (now > end) return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    if (now < start) return 'Upcoming'
    if (now > end) return 'Completed'
    return 'Active'
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </motion.div>
  )

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your events and monitor crowd status</p>
        </div>
        <Link
          to="/events/create"
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Calendar} 
          label="Total Events" 
          value={stats.totalEvents} 
          color="bg-primary-100 text-primary-600"
        />
        <StatCard 
          icon={Activity} 
          label="Active Events" 
          value={stats.activeEvents} 
          color="bg-green-100 text-green-600"
        />
        <StatCard 
          icon={Users} 
          label="People Monitored" 
          value={stats.totalCrowd.toLocaleString()} 
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Active Alerts" 
          value={stats.alerts} 
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Events</h2>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">Create your first event to start monitoring crowds</p>
            <Link
              to="/events/create"
              className="inline-flex items-center space-x-2 text-primary-600 font-semibold hover:text-primary-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/events/${event._id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{event.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event)}`}>
                          {getStatusText(event)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.startTime).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.location?.address || 'No location'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{event.zones?.reduce((sum, z) => sum + (z.currentCount || 0), 0) || 0} people</span>
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
