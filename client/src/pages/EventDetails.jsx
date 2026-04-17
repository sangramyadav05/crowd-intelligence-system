import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, MapPin, Calendar, Activity, Play, RotateCcw, Plus, AlertTriangle, Brain, TrendingUp, Armchair, Navigation, Save, Map, Image as ImageIcon } from 'lucide-react'
import { eventAPI, crowdAPI, seatingAPI, surveillanceAPI, venueAPI, venuePlanAPI } from '../lib/api'
import { adminSocket, joinEventRoom } from '../lib/socket'
import BlueprintHeatmap from '../components/BlueprintHeatmap'

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [seatingLayout, setSeatingLayout] = useState(null)
  const [seatStatusUpdate, setSeatStatusUpdate] = useState({ zoneId: '', seatId: '', status: 'available' })
  const [selectedSeatingZone, setSelectedSeatingZone] = useState('')
  const [geoPoint, setGeoPoint] = useState({ x: 50, y: 50 })
  const [nearestRoute, setNearestRoute] = useState(null)
  const [venuePlan, setVenuePlan] = useState(null)
  const [selectedPlanZoneId, setSelectedPlanZoneId] = useState('')
  const [planEditor, setPlanEditor] = useState({
    polygonJson: '[]',
    exitWidthMeters: 3,
    emergencyExitOnly: false
  })
  const [planSaveStatus, setPlanSaveStatus] = useState('')
  const [surveillanceZones, setSurveillanceZones] = useState([])
  const [isSurveillanceLoading, setIsSurveillanceLoading] = useState(false)
  const [surveillanceError, setSurveillanceError] = useState('')
  const [lastSurveillanceRefresh, setLastSurveillanceRefresh] = useState(null)
  const [selectedHeatmapZoneId, setSelectedHeatmapZoneId] = useState('')
  const [isBlueprintUploading, setIsBlueprintUploading] = useState(false)

  useEffect(() => {
    setSurveillanceZones([])
    setSurveillanceError('')
    setLastSurveillanceRefresh(null)
    fetchEventData()
  }, [id])

  useEffect(() => {
    if (activeTab !== 'surveillance' || !id) return undefined

    fetchSurveillanceData()
    const intervalId = window.setInterval(() => {
      fetchSurveillanceData({ silent: true })
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [activeTab, id])

  useEffect(() => {
    if (!venuePlan?.zones?.length) {
      setSelectedHeatmapZoneId('')
      return
    }

    setSelectedHeatmapZoneId((current) => (
      current && venuePlan.zones.some((zone) => zone.zoneId === current)
        ? current
        : venuePlan.zones[0].zoneId
    ))
  }, [venuePlan])

  useEffect(() => {
    if (!id) return undefined
    adminSocket.connect()
    // Join by mongo id first; once event loads we'll also join by eventId.
    joinEventRoom(adminSocket, id)

    const onDensityUpdate = (payload) => {
      setEvent((prev) => {
        if (!prev?.zones) return prev
        const zones = prev.zones.map((zone) =>
          String(zone._id) === String(payload.zoneId)
            ? { ...zone, currentCount: payload.count }
            : zone
        )
        return { ...prev, zones }
      })
    }

    const onSeatingUpdate = (payload) => {
      if (String(payload.eventId) !== String(id) && String(payload.eventId) !== String(event?.eventId)) return
      if (payload.zones) {
        setSeatingLayout((prev) => (prev ? { ...prev, zones: payload.zones, version: payload.version } : prev))
      } else {
        setSeatingLayout((prev) => (prev ? { ...prev, version: payload.version } : prev))
      }
    }

    const onPredictionUpdate = (payload) => {
      if (String(payload.eventId) !== String(id) && String(payload.eventId) !== String(event?.eventId)) return
      setDashboard((prev) => (prev ? { ...prev, predictions: payload.predictions || prev.predictions } : prev))
    }

    adminSocket.on('density_update', onDensityUpdate)
    adminSocket.on('seating_update', onSeatingUpdate)
    adminSocket.on('prediction_update', onPredictionUpdate)

    return () => {
      adminSocket.off('density_update', onDensityUpdate)
      adminSocket.off('seating_update', onSeatingUpdate)
      adminSocket.off('prediction_update', onPredictionUpdate)
      adminSocket.disconnect()
    }
  }, [id, event?.eventId])

  const fetchEventData = async () => {
    try {
      const [eventRes, dashboardRes] = await Promise.all([
        eventAPI.getById(id),
        eventAPI.getDashboard(id)
      ])
      setEvent(eventRes.data)
      setDashboard(dashboardRes.data)
      const seatingRes = await seatingAPI.getLayout(id)
      setSeatingLayout(seatingRes.data)
      if (seatingRes.data?.zones?.[0]?.zoneId) {
        setSelectedSeatingZone(seatingRes.data.zones[0].zoneId)
      }
      if (eventRes.data?.eventId) {
        joinEventRoom(adminSocket, eventRes.data.eventId)
        const planRes = await venuePlanAPI.getByEvent(eventRes.data.eventId)
        setVenuePlan(planRes.data)
        if (planRes.data?.zones?.[0]?.zoneId) {
          setSelectedPlanZoneId(planRes.data.zones[0].zoneId)
          const firstZone = planRes.data.zones[0]
          setPlanEditor({
            polygonJson: JSON.stringify(firstZone.polygon || [], null, 2),
            exitWidthMeters: firstZone.exitWidthMeters ?? 3,
            emergencyExitOnly: !!firstZone.emergencyExitOnly
          })
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSurveillanceData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setIsSurveillanceLoading(true)
      setSurveillanceError('')
      const { data } = await surveillanceAPI.getZones(id)
      setSurveillanceZones(data)
      setLastSurveillanceRefresh(new Date())
    } catch (error) {
      console.error('Error fetching surveillance data:', error)
      setSurveillanceError(error?.response?.data?.message || 'Unable to load surveillance data right now.')
    } finally {
      if (!silent) setIsSurveillanceLoading(false)
    }
  }

  const runSimulation = async () => {
    try {
      await crowdAPI.simulate(id)
      await fetchEventData()
      if (activeTab === 'surveillance') {
        await fetchSurveillanceData()
      }
    } catch (error) {
      console.error('Simulation error:', error)
    }
  }

  const resetCrowd = async () => {
    try {
      await crowdAPI.reset(id)
      await fetchEventData()
      if (activeTab === 'surveillance') {
        await fetchSurveillanceData()
      }
    } catch (error) {
      console.error('Reset error:', error)
    }
  }

  const updateSeatStatus = async (e) => {
    e.preventDefault()
    if (!seatStatusUpdate.zoneId || !seatStatusUpdate.seatId) return
    try {
      await seatingAPI.updateSeatStatus(id, {
        ...seatStatusUpdate,
        expectedVersion: seatingLayout?.version
      })
      const refreshed = await seatingAPI.getLayout(id)
      setSeatingLayout(refreshed.data)
    } catch (error) {
      console.error('Unable to update seat status:', error)
    }
  }

  const initializeZoneSeats = async (zone) => {
    if (!seatingLayout) return
    const updatedZones = seatingLayout.zones.map((z) => {
      if (z.zoneId !== String(zone._id)) return z
      const seats = []
      for (let row = 1; row <= z.rows; row += 1) {
        for (let number = 1; number <= z.seatsPerRow; number += 1) {
          seats.push({
            seatId: `${z.zoneId}-R${row}-S${number}`,
            row,
            number,
            x: number * 20,
            y: row * 20,
            status: 'available'
          })
        }
      }
      return { ...z, seats }
    })

    try {
      const { data } = await seatingAPI.saveLayout(id, {
        zones: updatedZones,
        expectedVersion: seatingLayout.version,
        note: `Generated seats for ${zone.name}`
      })
      setSeatingLayout(data)
    } catch (error) {
      console.error('Unable to generate seats:', error)
    }
  }

  const lookupNearestRoute = async () => {
    try {
      const { data } = await venueAPI.getNearestRoute(geoPoint)
      setNearestRoute(data)
    } catch (error) {
      console.error('Unable to fetch nearest route:', error)
    }
  }

  const selectPlanZone = (zoneId) => {
    setSelectedPlanZoneId(zoneId)
    const zone = venuePlan?.zones?.find((z) => z.zoneId === zoneId)
    if (!zone) return
    setPlanEditor({
      polygonJson: JSON.stringify(zone.polygon || [], null, 2),
      exitWidthMeters: zone.exitWidthMeters ?? 3,
      emergencyExitOnly: !!zone.emergencyExitOnly
    })
    setPlanSaveStatus('')
  }

  const savePlanZone = async (e) => {
    e.preventDefault()
    if (!event?.eventId || !selectedPlanZoneId) return
    try {
      const polygon = JSON.parse(planEditor.polygonJson || '[]')
      if (!Array.isArray(polygon)) {
        setPlanSaveStatus('Polygon must be a JSON array of {x,y} points.')
        return
      }

      await venuePlanAPI.updateZone(event.eventId, selectedPlanZoneId, {
        polygon,
        exitWidthMeters: Number(planEditor.exitWidthMeters),
        emergencyExitOnly: !!planEditor.emergencyExitOnly
      })
      const refreshed = await venuePlanAPI.getByEvent(event.eventId)
      setVenuePlan(refreshed.data)
      setPlanSaveStatus('Saved.')
    } catch (error) {
      setPlanSaveStatus(error?.response?.data?.message || 'Save failed.')
    }
  }

  const handleBlueprintUpload = async (file) => {
    if (!file || !event?.eventId || !venuePlan) return

    try {
      setIsBlueprintUploading(true)
      setPlanSaveStatus('')

      const blueprint = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve({
          imageData: reader.result,
          fileName: file.name,
          mimeType: file.type
        })
        reader.onerror = () => reject(new Error('Unable to read blueprint file.'))
        reader.readAsDataURL(file)
      })

      const { data } = await venuePlanAPI.saveFull(event.eventId, {
        blueprint,
        zones: venuePlan.zones || [],
        flowArrows: venuePlan.flowArrows || []
      })

      setVenuePlan(data)
      setPlanSaveStatus('Blueprint uploaded.')
    } catch (error) {
      setPlanSaveStatus(error?.response?.data?.message || error.message || 'Blueprint upload failed.')
    } finally {
      setIsBlueprintUploading(false)
    }
  }

  const getStatusColor = (occupancy) => {
    if (occupancy > 90) return 'bg-red-500'
    if (occupancy > 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getSeatColor = (status) => {
    if (status === 'occupied') return 'bg-red-500'
    if (status === 'blocked') return 'bg-gray-700'
    if (status === 'redirect') return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getZoneStatus = (capacity, currentCount) => {
    if (currentCount > capacity) {
      return {
        key: 'overcrowded',
        label: 'Avoid',
        emoji: '🔴',
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700'
      }
    }

    if (currentCount > capacity * 0.7) {
      return {
        key: 'busy',
        label: 'Busy',
        emoji: '🟡',
        border: 'border-l-orange-500',
        badge: 'bg-orange-100 text-orange-700'
      }
    }

    return {
      key: 'safe',
      label: 'Free',
      emoji: '🟢',
      border: 'border-l-green-500',
      badge: 'bg-green-100 text-green-700'
    }
  }

  const surveillanceCards = surveillanceZones.map(([zoneName, capacity, currentCount]) => {
    const status = getZoneStatus(capacity, currentCount)
    const displayLabel = status.key === 'overcrowded'
      ? '🔴 Avoid'
      : status.key === 'busy'
        ? '🟡 Busy'
        : '🟢 Free'

    return { zoneName, capacity, currentCount, status, displayLabel }
  })

  const cleanSurveillanceCards = surveillanceCards.map((zone) => ({
    ...zone,
    displayLabel: zone.status.key === 'overcrowded'
      ? 'Avoid'
      : zone.status.key === 'busy'
        ? 'Busy'
        : 'Free'
  }))

  const surveillanceSummary = cleanSurveillanceCards.reduce((summary, zone) => {
    if (zone.status.key === 'overcrowded') summary.overcrowded += 1
    else if (zone.status.key === 'busy') summary.busy += 1
    else summary.safe += 1
    return summary
  }, { safe: 0, busy: 0, overcrowded: 0 })

  const heatmapZones = (venuePlan?.zones || []).map((planZone) => {
    const eventZone = event?.zones?.find((zone) => String(zone._id) === planZone.zoneId)
      || event?.zones?.find((zone) => zone.name === planZone.name)
    const liveZone = cleanSurveillanceCards.find((zone) => zone.zoneName === planZone.name)
    const currentCount = liveZone?.currentCount ?? eventZone?.currentCount ?? 0
    const capacity = liveZone?.capacity ?? eventZone?.capacity ?? planZone.maxCapacity ?? 0
    const occupancy = capacity > 0 ? Math.round((currentCount / capacity) * 100) : 0
    const status = getZoneStatus(Math.max(capacity, 1), currentCount)

    return {
      id: planZone.zoneId,
      name: planZone.name,
      polygon: planZone.polygon || [],
      capacity,
      currentCount,
      occupancy,
      statusKey: status.key,
      statusLabel: status.label,
      intensity: occupancy,
      emergencyExitOnly: !!planZone.emergencyExitOnly
    }
  })

  const selectedHeatmapZone = heatmapZones.find((zone) => zone.id === selectedHeatmapZoneId) || heatmapZones[0] || null
  const hasSavedBlueprint = Boolean(venuePlan?.blueprint?.imageData)
  const blueprintStatus = isBlueprintUploading
    ? {
        label: 'Uploading blueprint',
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      }
    : hasSavedBlueprint
      ? {
          label: 'Blueprint saved to venue plan',
          tone: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      : {
          label: 'Blueprint not saved yet',
          tone: 'bg-amber-50 text-amber-700 border-amber-200'
        }

  const surveillanceTabs = ['overview', 'surveillance', 'zones', 'predictions', 'alerts', 'seating', 'geofence', 'venue-plan']

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
              Public Code: {event.accessCode}
            </span>
            <span className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-medium">
              Coordinator ID: {event.coordinators?.[0]?.coordinatorId || 'Not ready'}
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
        {surveillanceTabs.map((tab) => (
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

        {activeTab === 'surveillance' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Surveillance Intelligence</h3>
                <p className="text-sm text-gray-500">
                  Blueprint-backed heatmap with live zone status for instant scanning.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchSurveillanceData}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Refresh Surveillance
              </button>
            </div>

            {isSurveillanceLoading && (
              <div className="py-10 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {!isSurveillanceLoading && surveillanceError && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
                {surveillanceError}
              </div>
            )}

            {!isSurveillanceLoading && !surveillanceError && (
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f4f6f8] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Live Zone Status</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Auto-refreshes every 3 seconds
                      {lastSurveillanceRefresh ? ` | Updated ${lastSurveillanceRefresh.toLocaleTimeString()}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600">
                      Zones: <span className="font-semibold text-slate-900">{cleanSurveillanceCards.length}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white border border-green-200 text-green-700">
                      Safe: <span className="font-semibold">{surveillanceSummary.safe}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white border border-orange-200 text-orange-700">
                      Busy: <span className="font-semibold">{surveillanceSummary.busy}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-700">
                      Overcrowded: <span className="font-semibold">{surveillanceSummary.overcrowded}</span>
                    </div>
                  </div>
                </div>

                {cleanSurveillanceCards.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200 px-6 py-12 text-center text-gray-500">
                    No zone data available for this event yet.
                  </div>
                ) : (
                  <div className="grid xl:grid-cols-[1.45fr,0.95fr] gap-6 items-start">
                    <BlueprintHeatmap
                      blueprint={venuePlan?.blueprint}
                      zones={heatmapZones}
                      selectedZoneId={selectedHeatmapZone?.id}
                      onSelectZone={setSelectedHeatmapZoneId}
                      title="Venue Heatmap"
                      subtitle={venuePlan?.blueprint?.fileName ? 'Blueprint-linked live crowd overlay' : 'Live crowd overlay with default zone layout'}
                    />

                    <div className="space-y-4">
                      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Selected Zone</p>
                            <h5 className="mt-2 text-2xl font-semibold text-slate-950">
                              {selectedHeatmapZone?.name || 'No zone selected'}
                            </h5>
                          </div>
                          {selectedHeatmapZone && (
                            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                              selectedHeatmapZone.statusKey === 'overcrowded'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : selectedHeatmapZone.statusKey === 'busy'
                                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                                  : 'border-green-200 bg-green-50 text-green-700'
                            }`}>
                              {selectedHeatmapZone.statusLabel}
                            </span>
                          )}
                        </div>

                        {selectedHeatmapZone ? (
                          <>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-sm text-slate-500">Current Count</div>
                                <div className="mt-2 text-3xl font-bold text-slate-950">{selectedHeatmapZone.currentCount}</div>
                              </div>
                              <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="text-sm text-slate-500">Occupancy</div>
                                <div className="mt-2 text-3xl font-bold text-slate-950">{selectedHeatmapZone.occupancy}%</div>
                              </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                              Capacity: <span className="font-semibold text-slate-900">{selectedHeatmapZone.capacity}</span>
                              {selectedHeatmapZone.emergencyExitOnly ? (
                                <span className="ml-3 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                  Emergency Exit Only
                                </span>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <p className="mt-4 text-sm text-slate-500">Select a zone to inspect its live crowd details.</p>
                        )}
                      </div>

                      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <h5 className="text-lg font-semibold text-slate-950">Live Zone List</h5>
                            <p className="text-sm text-slate-500">Instant scan of every zone in this event.</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {cleanSurveillanceCards.map((zone) => {
                            const matchingZone = heatmapZones.find((item) => item.name === zone.zoneName)

                            return (
                              <button
                                key={zone.zoneName}
                                type="button"
                                onClick={() => matchingZone && setSelectedHeatmapZoneId(matchingZone.id)}
                                className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-white ${
                                  matchingZone?.id === selectedHeatmapZone?.id ? 'ring-2 ring-primary-200 border-primary-300' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-900">{zone.zoneName}</div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      {zone.currentCount} / {zone.capacity} people
                                    </div>
                                  </div>
                                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${zone.status.badge}`}>
                                    {zone.displayLabel}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

        {activeTab === 'seating' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Armchair className="w-5 h-5" />
                <span>Seating Layout</span>
              </h3>
              <span className="text-sm text-gray-500">Version {seatingLayout?.version || 0}</span>
            </div>

            <div className="space-y-4 mb-6">
              {event.zones?.map((zone) => {
                const seatZone = seatingLayout?.zones?.find((z) => z.zoneId === String(zone._id))
                const seatCount = seatZone?.seats?.length || 0
                return (
                  <div key={zone._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{zone.name}</h4>
                        <p className="text-sm text-gray-500">{seatCount} seats configured</p>
                      </div>
                      <button
                        onClick={() => initializeZoneSeats(zone)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        Generate Seats
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={updateSeatStatus} className="grid md:grid-cols-4 gap-3 p-4 border border-gray-200 rounded-xl">
              <select
                value={seatStatusUpdate.zoneId}
                onChange={(e) => setSeatStatusUpdate((prev) => ({ ...prev, zoneId: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="">Select zone</option>
                {seatingLayout?.zones?.map((zone) => (
                  <option key={zone.zoneId} value={zone.zoneId}>{zone.name}</option>
                ))}
              </select>
              <input
                value={seatStatusUpdate.seatId}
                onChange={(e) => setSeatStatusUpdate((prev) => ({ ...prev, seatId: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Seat ID"
              />
              <select
                value={seatStatusUpdate.status}
                onChange={(e) => setSeatStatusUpdate((prev) => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                {['available', 'occupied', 'blocked', 'redirect'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                Update Seat
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Seat Map Preview</h4>
                <select
                  value={selectedSeatingZone}
                  onChange={(e) => setSelectedSeatingZone(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {seatingLayout?.zones?.map((zone) => (
                    <option key={zone.zoneId} value={zone.zoneId}>{zone.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Occupied</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-700 inline-block" />Blocked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" />Redirect</span>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-80 overflow-auto">
                <div className="grid grid-cols-12 gap-2">
                  {seatingLayout?.zones
                    ?.find((zone) => zone.zoneId === selectedSeatingZone)
                    ?.seats?.map((seat) => (
                      <button
                        key={seat.seatId}
                        type="button"
                        onClick={() => setSeatStatusUpdate((prev) => ({
                          ...prev,
                          zoneId: selectedSeatingZone,
                          seatId: seat.seatId
                        }))}
                        className={`w-full h-8 rounded text-[10px] text-white font-medium ${getSeatColor(seat.status)}`}
                        title={`${seat.seatId} (${seat.status})`}
                      >
                        {seat.number}
                      </button>
                    ))}
                </div>
                {!(seatingLayout?.zones?.find((zone) => zone.zoneId === selectedSeatingZone)?.seats?.length) && (
                  <p className="text-sm text-gray-500">Generate seats for this zone to view the seat map.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'geofence' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Navigation className="w-5 h-5" />
              <span>Geofence and Route Planner</span>
            </h3>

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <input
                type="number"
                value={geoPoint.x}
                onChange={(e) => setGeoPoint((prev) => ({ ...prev, x: Number(e.target.value) }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="X coordinate"
              />
              <input
                type="number"
                value={geoPoint.y}
                onChange={(e) => setGeoPoint((prev) => ({ ...prev, y: Number(e.target.value) }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Y coordinate"
              />
              <button
                onClick={lookupNearestRoute}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Find Nearest Route
              </button>
            </div>

            {nearestRoute && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Nearest Entry</p>
                  <p className="text-lg font-semibold text-green-900">{nearestRoute.nearestEntry?.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Nearest Exit</p>
                  <p className="text-lg font-semibold text-blue-900">{nearestRoute.nearestExit?.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'venue-plan' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Map className="w-5 h-5" />
                <span>Venue Plan Zones</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${blueprintStatus.tone}`}>
                  {blueprintStatus.label}
                </span>
                <span className="text-sm text-gray-500">Version {venuePlan?.version || 0}</span>
              </div>
            </div>

            {!venuePlan ? (
              <p className="text-sm text-gray-500">No venue plan loaded yet for this event.</p>
            ) : (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Venue Blueprint</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Upload or replace the image used by the admin and public heatmaps for this event.
                        </p>
                        <p className="text-sm text-gray-700 mt-3">
                          Current file: <span className="font-medium">{venuePlan.blueprint?.fileName || 'No blueprint saved yet'}</span>
                        </p>
                        <p className="text-sm mt-2">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${blueprintStatus.tone}`}>
                            {blueprintStatus.label}
                          </span>
                        </p>
                      </div>
                    </div>

                    <label className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-white ${
                      isBlueprintUploading ? 'bg-indigo-300 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBlueprintUpload(e.target.files?.[0])}
                        disabled={isBlueprintUploading}
                      />
                      <span>{isBlueprintUploading ? 'Uploading...' : 'Upload Blueprint'}</span>
                    </label>
                  </div>

                  {venuePlan.blueprint?.imageData && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img
                        src={venuePlan.blueprint.imageData}
                        alt={venuePlan.blueprint.fileName || 'Venue blueprint'}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-900">
                      Zones
                    </div>
                    <div className="divide-y divide-gray-100">
                      {venuePlan.zones.length === 0 && (
                        <div className="px-4 py-4 text-sm text-gray-500">No zones in plan yet.</div>
                      )}
                      {venuePlan.zones.map((zone) => (
                        <button
                          key={zone.zoneId}
                          type="button"
                          onClick={() => selectPlanZone(zone.zoneId)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                            selectedPlanZoneId === zone.zoneId ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{zone.name}</div>
                          <div className="text-xs text-gray-500">{zone.zoneId}</div>
                          {zone.emergencyExitOnly && (
                            <div className="text-xs mt-1 text-rose-700 font-semibold">Emergency Exit Only</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 border border-gray-200 rounded-xl p-4">
                    <form onSubmit={savePlanZone} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500">Selected zone</div>
                          <div className="font-semibold text-gray-900">{selectedPlanZoneId || '-'}</div>
                        </div>
                        <button
                          type="submit"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          disabled={!selectedPlanZoneId}
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>

                      {planSaveStatus && (
                        <div className={`text-sm px-3 py-2 rounded-lg ${
                          planSaveStatus === 'Saved.' || planSaveStatus === 'Blueprint uploaded.'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {planSaveStatus}
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Exit width (meters)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={planEditor.exitWidthMeters}
                            onChange={(e) => setPlanEditor((prev) => ({ ...prev, exitWidthMeters: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center space-x-3 mt-7">
                          <input
                            id="emergencyExitOnly"
                            type="checkbox"
                            checked={planEditor.emergencyExitOnly}
                            onChange={(e) => setPlanEditor((prev) => ({ ...prev, emergencyExitOnly: e.target.checked }))}
                            className="h-4 w-4"
                          />
                          <label htmlFor="emergencyExitOnly" className="text-sm font-medium text-gray-700">
                            Emergency Exit Only (high priority)
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Polygon JSON (points)</label>
                        <textarea
                          value={planEditor.polygonJson}
                          onChange={(e) => setPlanEditor((prev) => ({ ...prev, polygonJson: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs h-52"
                          placeholder='[{"x":10,"y":10},{"x":90,"y":10},{"x":90,"y":40},{"x":10,"y":40}]'
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Use coordinates in the same plane as GPS normalization (demo). Changes broadcast live.
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
