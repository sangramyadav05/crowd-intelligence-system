import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, Users, MapPin, ArrowRight, Activity, AlertCircle, TrendingUp, Trash2 } from 'lucide-react'
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

  const handleDeleteEvent = async (eventId, eventName, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      try {
        await eventAPI.delete(eventId)
        setEvents(events.filter(e => e._id !== eventId))
        
        // Recalculate stats
        const updatedEvents = events.filter(e => e._id !== eventId)
        const now = new Date()
        const active = updatedEvents.filter(e => new Date(e.startTime) <= now && new Date(e.endTime) >= now)
        const totalCrowd = updatedEvents.reduce((sum, e) => sum + (e.zones?.reduce((z, zone) => z + (zone.currentCount || 0), 0) || 0), 0)
        
        setStats({
          totalEvents: updatedEvents.length,
          activeEvents: active.length,
          totalCrowd,
          alerts: active.reduce((sum, e) => sum + (e.zones?.filter(z => z.currentCount > z.capacity * 0.8).length || 0), 0)
        })
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Failed to delete event. Please try again.')
      }
    }
  }

  const getStatusColor = (event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    if (now < start) return 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
    if (now > end) return 'bg-slate-800 text-slate-400 border border-slate-700'
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  }

  const getStatusText = (event) => {
    const now = new Date()
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    if (now < start) return 'Upcoming'
    if (now > end) return 'Completed'
    return 'Active'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      variants={itemVariants}
      className="bg-slate-900/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-slate-800 hover:border-accent-cyan/50 transition-colors"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 border border-white/5`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold text-white font-display">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </motion.div>
  )

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your events and monitor crowd status</p>
        </div>
        <Link
          to="/events/create"
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border-none"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Stats */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Calendar} 
          label="Total Events" 
          value={stats.totalEvents} 
          color="bg-accent-cyan/20 text-accent-cyan"
        />
        <StatCard 
          icon={Activity} 
          label="Active Events" 
          value={stats.activeEvents} 
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard 
          icon={Users} 
          label="People Monitored" 
          value={stats.totalCrowd.toLocaleString()} 
          color="bg-accent-purple/20 text-accent-purple"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Active Alerts" 
          value={stats.alerts} 
          color="bg-rose-500/20 text-rose-400"
        />
      </motion.div>

      {/* Events List */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Events</h2>
          <TrendingUp className="w-5 h-5 text-slate-500" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-accent-cyan rounded-full animate-spin mx-auto" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Calendar className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No events yet</h3>
            <p className="text-slate-400 mb-4">Create your first event to start monitoring crowds</p>
            <Link
              to="/events/create"
              className="inline-flex items-center space-x-2 text-accent-cyan font-semibold hover:text-accent-purple transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/events/${event._id}`}
                  className="block px-6 py-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white truncate">{event.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event)}`}>
                          {getStatusText(event)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
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
                    <div className="ml-4 flex items-center space-x-2">
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-accent-cyan transition-colors" />
                      <button
                        onClick={(e) => handleDeleteEvent(event._id, event.name, e)}
                        className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors group"
                        title="Delete event"
                      >
                        <Trash2 className="w-5 h-5 text-slate-500 group-hover:text-rose-400" />
                      </button>
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
