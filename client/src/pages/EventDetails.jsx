import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, MapPin, Calendar, Activity, Play, RotateCcw, Plus, AlertTriangle, Brain, TrendingUp } from 'lucide-react'
import { eventAPI, crowdAPI, aiAPI } from '../lib/api'

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchEventData()
  }, [id])

  const fetchEventData = async () => {
    try {
      const [eventRes, dashboardRes] = await Promise.all([
        eventAPI.getById(id),
        eventAPI.getDashboard(id)
      ])
      setEvent(eventRes.data)
      setDashboard(dashboardRes.data)
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runSimulation = async () => {
    try {
      await crowdAPI.simulate(id)
      fetchEventData()
    } catch (error) {
      console.error('Simulation error:', error)
    }
  }

  const resetCrowd = async () => {
    try {
      await crowdAPI.reset(id)
      fetchEventData()
    } catch (error) {
      console.error('Reset error:', error)
    }
  }

  const getStatusColor = (occupancy) => {
    if (occupancy > 90) return 'bg-red-500'
    if (occupancy > 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="pt-20 text-center">
        <p className="text-gray-600">Event not found</p>
        <Link to="/dashboard" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location?.address}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(event.startTime).toLocaleString()}</span>
              </span>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <span className="px-4 py-2 bg-primary-100 text-primary-800 rounded-lg font-medium">
              Code: {event.accessCode}
            </span>
            <span className={`px-4 py-2 rounded-lg font-medium ${
              dashboard?.stats?.status === 'active' ? 'bg-green-100 text-green-800' :
              dashboard?.stats?.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {dashboard?.stats?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard?.stats?.totalCrowd?.toLocaleString() || 0}</div>
          <div className="text-gray-500 text-sm">Current Crowd</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard?.stats?.totalCapacity?.toLocaleString() || 0}</div>
          <div className="text-gray-500 text-sm">Total Capacity</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard?.alerts?.length || 0}</div>
          <div className="text-gray-500 text-sm">Active Alerts</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard?.predictions?.length || 0}</div>
          <div className="text-gray-500 text-sm">AI Predictions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {['overview', 'zones', 'predictions', 'alerts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runSimulation}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Run Simulation</span>
              </button>
              <button
                onClick={resetCrowd}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {/* Zones Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.zones?.map((zone) => {
                const occupancy = Math.round((zone.currentCount / zone.capacity) * 100)
                return (
                  <div key={zone._id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        occupancy > 90 ? 'bg-red-100 text-red-800' :
                        occupancy > 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {occupancy}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {zone.currentCount} <span className="text-sm font-normal text-gray-500">/ {zone.capacity}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStatusColor(occupancy)}`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI Recommendations */}
            {dashboard?.recommendations?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>AI Recommendations</span>
                </h3>
                <div className="space-y-3">
                  {dashboard.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl ${
                        rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                        rec.priority === 'medium' ? 'bg-amber-50 border border-amber-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'zones' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Zones</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Plus className="w-4 h-4" />
                <span>Add Zone</span>
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {event.zones?.map((zone) => (
                <div key={zone._id} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{zone.name}</h4>
                    <p className="text-sm text-gray-500">Capacity: {zone.capacity}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold">{zone.currentCount}</span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Predictions (15 min ahead)</h3>
            {dashboard?.predictions?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No predictions available. Run simulation to generate predictions.</p>
            ) : (
              <div className="space-y-4">
                {dashboard?.predictions?.map((pred) => (
                  <div key={pred.zoneId} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{pred.zoneName}</h4>
                        <p className="text-sm text-gray-500">
                          Current: {pred.currentCount} → Predicted: {pred.predictedCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          pred.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                          pred.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          pred.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pred.riskLevel} risk
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{Math.round(pred.confidence * 100)}% confidence</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-2 text-sm">
                      <TrendingUp className={`w-4 h-4 ${
                        pred.trend === 'increasing' ? 'text-red-500' :
                        pred.trend === 'decreasing' ? 'text-green-500' :
                        'text-gray-500'
                      }`} />
                      <span className="text-gray-600">Trend: {pred.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
            {dashboard?.alerts?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-500">No active alerts. All zones operating normally.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard?.alerts?.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-4 rounded-xl ${
                      alert.severity === 'emergency' ? 'bg-red-50 border border-red-200' :
                      alert.severity === 'critical' ? 'bg-orange-50 border border-orange-200' :
                      'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        alert.severity === 'emergency' ? 'text-red-600' :
                        alert.severity === 'critical' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-gray-600 mt-1">{alert.message}</p>
                        {alert.recommendedAction && (
                          <p className="text-sm text-gray-500 mt-2">
                            Recommended: {alert.recommendedAction}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'emergency' ? 'bg-red-200 text-red-800' :
                        alert.severity === 'critical' ? 'bg-orange-200 text-orange-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
