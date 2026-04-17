import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, AlertTriangle, Activity, TrendingUp, Shield, Search, Filter, MoreVertical, Send } from 'lucide-react'
import { adminAPI, operationsAPI } from '../lib/api'
import { adminSocket, joinEventRoom } from '../lib/socket'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalUsers: 0,
    pendingAlerts: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [criticalAlerts, setCriticalAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [commandText, setCommandText] = useState('')
  const [operationType, setOperationType] = useState('event')
  const [socketConnected, setSocketConnected] = useState(false)
  const [liveOpsFeed, setLiveOpsFeed] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    adminSocket.connect()
    const onConnect = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)
    const onOperationsUpdate = (payload) => {
      setLiveOpsFeed((prev) => [payload, ...prev].slice(0, 8))
    }
    adminSocket.on('connect', onConnect)
    adminSocket.on('disconnect', onDisconnect)
    adminSocket.on('operations_update', onOperationsUpdate)

    return () => {
      adminSocket.off('connect', onConnect)
      adminSocket.off('disconnect', onDisconnect)
      adminSocket.off('operations_update', onOperationsUpdate)
      adminSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    joinEventRoom(adminSocket, selectedEventId)
  }, [selectedEventId])

  const fetchDashboardData = async () => {
    try {
      const { data } = await adminAPI.getDashboard()
      setStats(data.stats)
      setRecentEvents(data.recentEvents)
      setCriticalAlerts(data.criticalAlerts)
      if (data.recentEvents?.[0]) setSelectedEventId(data.recentEvents[0].eventId || data.recentEvents[0]._id)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendCommand = async (e) => {
    e.preventDefault()
    if (!selectedEventId || !commandText.trim()) return
    try {
      await adminAPI.sendCommand(selectedEventId, { message: commandText.trim(), type: 'broadcast' })
      await operationsAPI.publish(selectedEventId, {
        type: operationType,
        message: commandText.trim(),
        priority: operationType === 'gathering' ? 'high' : 'normal'
      })
      setCommandText('')
    } catch (error) {
      console.error('Unable to send command', error)
    }
  }

  const activateEmergency = async () => {
    if (!selectedEventId) return
    try {
      await adminAPI.activateEmergency(selectedEventId, { level: 'critical', activePlan: 'Emergency protocol' })
    } catch (error) {
      console.error('Unable to activate emergency', error)
    }
  }

  const clearEmergency = async () => {
    if (!selectedEventId) return
    try {
      await adminAPI.deactivateEmergency(selectedEventId)
    } catch (error) {
      console.error('Unable to clear emergency', error)
    }
  }

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-gray-500 text-sm">{label}</div>
      </div>
    </motion.div>
  )

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-gray-800" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600 mt-1">System-wide monitoring and management</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Calendar} 
          label="Total Events" 
          value={stats.totalEvents} 
          color="bg-blue-100 text-blue-600"
          trend={12}
        />
        <StatCard 
          icon={Activity} 
          label="Active Events" 
          value={stats.activeEvents} 
          color="bg-green-100 text-green-600"
        />
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={stats.totalUsers} 
          color="bg-purple-100 text-purple-600"
          trend={8}
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Pending Alerts" 
          value={stats.pendingAlerts} 
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Live Command Center</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {socketConnected ? 'Socket Online' : 'Socket Offline'}
          </span>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          >
            {recentEvents.length === 0 && <option value="">No events available</option>}
            {recentEvents.map((event) => (
              <option key={event._id} value={event.eventId || event._id}>{event.name}</option>
            ))}
          </select>
          <form onSubmit={sendCommand} className="md:col-span-2 flex gap-2">
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="event">event</option>
              <option value="gathering">gathering</option>
              <option value="crowd_management">crowd_management</option>
            </select>
            <input
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Broadcast instruction..."
            />
            <button type="submit" className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex gap-2">
            <button onClick={activateEmergency} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Activate</button>
            <button onClick={clearEmergency} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">Clear</button>
          </div>
        </div>
        {liveOpsFeed.length > 0 && (
          <div className="mt-4 space-y-2">
            {liveOpsFeed.map((item) => (
              <div key={item._id} className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-700">{item.type}</span>: {item.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Critical Alerts ({criticalAlerts.length})</h2>
          </div>
          <div className="space-y-3">
            {criticalAlerts.slice(0, 3).map((alert) => (
              <div key={alert._id} className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-500">Event: {alert.event?.name}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No events found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentEvents.map((event) => (
              <div key={event._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.status === 'active' ? 'bg-green-100 text-green-800' :
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>By: {event.organizer?.name}</span>
                      <span>•</span>
                      <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{event.zones?.length || 0} zones</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
