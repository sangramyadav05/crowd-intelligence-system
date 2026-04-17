import { useEffect, useState } from 'react'
import CrowdHeatmap from '../components/CrowdHeatmap'
import SectionHeader from '../components/SectionHeader'
import ZoneCard from '../components/ZoneCard'
import { createCrowdSocket } from '../services/crowdSocket'
import { getDensityStatus, zoneConfig } from '../utils/crowdConfig'

function Dashboard() {
  const [crowdData, setCrowdData] = useState(null)
  const [predictedData, setPredictedData] = useState(null)
  const [actions, setActions] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('Loading live crowd data...')

  const highDensityZones = crowdData
    ? Object.entries(crowdData).filter(([, value]) => value > 70)
    : []

  useEffect(() => {
    const socket = createCrowdSocket()

    socket.on('connect', () => {
      setStatus('Live Socket.IO stream connected.')
    })

    socket.on('crowd:update', (data) => {
      setCrowdData(data.current ?? {})
      setPredictedData(data.predicted ?? data.current ?? {})
      setActions(data.actions ?? {})
      setIsLoading(false)
      setStatus('Live updates streaming from the backend.')
    })

    socket.on('connect_error', () => {
      setIsLoading(false)
      setStatus('Waiting for live data...')
    })

    socket.on('disconnect', () => {
      setStatus('Live connection lost. Reconnecting...')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!crowdData && !predictedData) {
      setNotifications([])
      return
    }

    const nextNotifications = []

    Object.entries(zoneConfig).forEach(([zoneKey, zone]) => {
      const currentValue = crowdData?.[zoneKey]
      const predictedValue = predictedData?.[zoneKey]

      if (typeof currentValue === 'number' && currentValue > 70) {
        nextNotifications.push({
          id: `${zoneKey}-current`,
          type: 'high-current',
          zone: zone.label,
          message: 'High crowd detected',
        })
      }

      if (typeof predictedValue === 'number' && predictedValue > 80) {
        nextNotifications.push({
          id: `${zoneKey}-predicted`,
          type: 'surge-expected',
          zone: zone.label,
          message: 'Surge expected',
        })
      }
    })

    setNotifications(nextNotifications)
  }, [crowdData, predictedData])

  const bannerClasses = isLoading
    ? 'border-slate-700 bg-slate-950/70 text-slate-200'
    : notifications.length > 0
      ? 'border-red-500/30 bg-red-500/10 text-red-100'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'

  const bannerText = isLoading
    ? 'System status: establishing live monitoring connection.'
    : notifications.length > 0
      ? 'System status: active crowd alerts require attention.'
      : 'System status: live monitoring active and crowd conditions are stable.'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(239,68,68,0.12),_transparent_22%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]" />
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full rounded-[2rem] border border-slate-800/80 bg-slate-900/75 p-6 shadow-[0_32px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl sm:p-10">
          <div className="space-y-10">
            <div className={`rounded-3xl border p-5 ${bannerClasses}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] opacity-80">
                System Status
              </p>
              <p className="mt-3 text-base font-medium sm:text-lg">{bannerText}</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
              <div className="space-y-5">
                <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300">
                  Crowd Intelligence System
                </span>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                    Crowd Intelligence Dashboard
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                    {status}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Stream Mode
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">Socket.IO Live</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Active Zones
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {Object.keys(zoneConfig).length}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Notifications
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {notifications.length}
                  </p>
                </div>
              </div>
            </div>
            {!isLoading && highDensityZones.length > 0 && (
              <div className="dashboard-pulse rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-300">
                  Alerts
                </p>
                <div className="mt-3 space-y-2">
                  {highDensityZones.map(([zoneKey]) => (
                    <p key={zoneKey} className="text-sm text-red-100 sm:text-base">
                      High crowd density detected in {zoneConfig[zoneKey].label}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {!isLoading && highDensityZones.length === 0 && (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Alerts
                </p>
                <p className="mt-3 text-sm text-emerald-100 sm:text-base">
                  No high-density zones detected.
                </p>
              </div>
            )}
            {isLoading && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Alerts
                </p>
                <p className="mt-3 text-sm text-slate-400 sm:text-base">
                  Monitoring crowd conditions...
                </p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <SectionHeader
                  eyebrow="Live Metrics"
                  title="Current Crowd Density"
                  description="Streaming zone-by-zone occupancy with animated values and density-driven prioritization."
                />
              </div>
              {Object.entries(zoneConfig).map(([key, zone]) => {
                const value = crowdData?.[key]
                const densityStatus =
                  typeof value === 'number' ? getDensityStatus(value) : null

                return (
                  <ZoneCard
                    key={key}
                    label={zone.label}
                    value={isLoading ? 'Loading...' : value ?? '--'}
                    densityLabel={densityStatus?.label ?? 'Pending'}
                    densityClasses={
                      densityStatus?.classes ??
                      'bg-slate-800 text-slate-300 ring-1 ring-slate-700'
                    }
                  />
                )
              })}
            </div>
            <div className="space-y-4">
              <SectionHeader
                eyebrow="Forecast"
                title="Predicted Crowd (Next 10 mins)"
                description="Short-horizon projection based on recent movement trends and live density drift."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(zoneConfig).map(([key, zone]) => {
                  const value = predictedData?.[key]
                  const safeValue =
                    typeof value === 'number' ? Math.max(0, value) : value
                  const densityStatus =
                    typeof safeValue === 'number' ? getDensityStatus(safeValue) : null

                  return (
                    <ZoneCard
                      key={`predicted-${key}`}
                      label={zone.label}
                      value={isLoading ? 'Loading...' : safeValue ?? '--'}
                      densityLabel={densityStatus?.label ?? 'Pending'}
                      densityClasses={
                        densityStatus?.classes ??
                        'bg-slate-800 text-slate-300 ring-1 ring-slate-700'
                      }
                      valueCaption='Predicted number of people'
                    />
                  )
                })}
              </div>
            </div>
            <div className="space-y-4">
              <SectionHeader
                eyebrow="Alert Feed"
                title="Real-Time Notifications"
                description="Instant alert feed generated from current and predicted crowd behavior."
              />
              {isLoading && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400 sm:text-base">
                    Waiting for live notifications...
                  </p>
                </div>
              )}
              {!isLoading && notifications.length === 0 && (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-sm text-emerald-100 sm:text-base">
                    No active notifications. The system is monitoring crowd conditions normally.
                  </p>
                </div>
              )}
              {!isLoading && notifications.length > 0 && (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const notificationClasses =
                      notification.type === 'surge-expected'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                        : 'border-red-500/30 bg-red-500/10 text-red-100'

                    return (
                      <article
                        key={notification.id}
                        className={`dashboard-pulse rounded-3xl border p-5 ${notificationClasses}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] opacity-80">
                              {notification.zone}
                            </p>
                            <p className="text-base font-semibold sm:text-lg">
                              {notification.message}
                            </p>
                          </div>
                          <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                            Live
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <SectionHeader
                eyebrow="Decision Support"
                title="Smart Management Actions"
                description="Operational recommendations derived from predicted crowd pressure in each monitored zone."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(zoneConfig).map(([key, zone]) => {
                  const action = actions?.[key] ?? 'Pending'
                  const actionClasses =
                    action === 'Restrict entry and redirect crowd'
                      ? 'border-red-500/30 bg-red-500/10 text-red-100'
                      : action === 'Prepare to redirect crowd'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                        : action === 'Safe'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300'

                  return (
                    <article
                      key={`action-${key}`}
                      className={`rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${actionClasses}`}
                    >
                      <p className="text-sm uppercase tracking-[0.24em] opacity-80">
                        {zone.label}
                      </p>
                      <p className="mt-4 text-lg font-semibold">
                        {isLoading ? 'Waiting for guidance...' : action}
                      </p>
                      <p className="mt-2 text-sm opacity-80">
                        Recommended operational response
                      </p>
                    </article>
                  )
                })}
              </div>
            </div>
            <CrowdHeatmap crowdData={crowdData} isLoading={isLoading} />
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
