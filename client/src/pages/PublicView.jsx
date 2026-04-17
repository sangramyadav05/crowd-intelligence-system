import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, AlertTriangle, CheckCircle, MapPin, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import { publicAPI } from '../lib/api'

export default function PublicView() {
  const [accessCode, setAccessCode] = useState('')
  const [eventData, setEventData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const { data } = await publicAPI.lookupEvent(accessCode.toUpperCase())
      setEventData(data)
    } catch (err) {
      setError('Event not found. Please check your access code.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (occupancy) => {
    if (occupancy > 90) return 'bg-red-500'
    if (occupancy > 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStatusText = (occupancy) => {
    if (occupancy > 90) return 'Avoid - Very Crowded'
    if (occupancy > 70) return 'Busy - Caution'
    return 'Safe - Good to Visit'
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      <AnimatePresence mode="wait">
        {!eventData ? (
          <motion.div
            key="lookup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4"
          >
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Check Crowd Status</h1>
                <p className="text-gray-600 mt-2">Enter your event access code to view live crowd information</p>
              </div>

              <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-xl p-8">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none text-lg tracking-wider font-mono uppercase"
                    placeholder="ENTER CODE"
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>View Crowd Status</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>Need an access code? Contact the event organizer</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 sm:p-8"
          >
            {/* Event Header */}
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setEventData(null)}
                className="mb-4 text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Check another event</span>
              </button>

              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{eventData.event?.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{eventData.event?.location?.address}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(eventData.event?.startTime).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 px-4 py-2 bg-primary-100 text-primary-800 rounded-lg font-medium">
                    Code: {eventData.event?.accessCode}
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Status</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      eventData.overallStatus === 'safe' ? 'bg-green-100' :
                      eventData.overallStatus === 'moderate' ? 'bg-yellow-100' :
                      eventData.overallStatus === 'high' ? 'bg-orange-100' :
                      'bg-red-100'
                    }`}>
                      {eventData.overallStatus === 'safe' ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <AlertTriangle className={`w-8 h-8 ${
                          eventData.overallStatus === 'moderate' ? 'text-yellow-600' :
                          eventData.overallStatus === 'high' ? 'text-orange-600' :
                          'text-red-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{eventData.totalCrowd?.toLocaleString()} people</p>
                      <p className="text-gray-500">Currently at event</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      eventData.overallStatus === 'safe' ? 'text-green-600' :
                      eventData.overallStatus === 'moderate' ? 'text-yellow-600' :
                      eventData.overallStatus === 'high' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {eventData.overallStatus === 'safe' ? 'Safe to Visit' :
                       eventData.overallStatus === 'moderate' ? 'Moderate Crowd' :
                       eventData.overallStatus === 'high' ? 'High Crowd - Caution' :
                       'Critical - Avoid'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zone Status */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone Status</h2>
                <div className="space-y-4">
                  {eventData.zones?.map((zone) => (
                    <div key={zone.zoneId} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          zone.status === 'safe' ? 'bg-green-100 text-green-800' :
                          zone.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {zone.status === 'safe' ? 'Safe' : zone.status === 'busy' ? 'Busy' : 'Avoid'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>{zone.currentCount} / {zone.capacity} people</span>
                        <span>({zone.occupancy}% full)</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getStatusColor(zone.occupancy)}`}
                          style={{ width: `${Math.min(100, zone.occupancy)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {eventData.alerts?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Alerts</h2>
                  <div className="space-y-3">
                    {eventData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl flex items-start space-x-3 ${
                          alert.severity === 'emergency' ? 'bg-red-50 border border-red-200' :
                          alert.severity === 'critical' ? 'bg-orange-50 border border-orange-200' :
                          'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          alert.severity === 'emergency' ? 'text-red-600' :
                          alert.severity === 'critical' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          {alert.recommendedAction && (
                            <p className="text-sm text-gray-600 mt-1">{alert.recommendedAction}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {eventData.recommendations?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
                  <div className="space-y-3">
                    {eventData.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-500">
                <p className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Last updated: {new Date(eventData.lastUpdated).toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
