import { useEffect, useState } from 'react'
import ZoneCard from '../components/ZoneCard'
import { fetchCrowdData } from '../services/crowdApi'

const zoneLabels = {
  zoneA: 'Zone A',
  zoneB: 'Zone B',
  zoneC: 'Zone C',
}

function getDensityStatus(value) {
  if (value <= 30) {
    return {
      label: 'Low',
      classes: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
    }
  }

  if (value <= 70) {
    return {
      label: 'Medium',
      classes: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    }
  }

  return {
    label: 'High',
    classes: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  }
}

function Dashboard() {
  const [crowdData, setCrowdData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('Loading live crowd data...')

  const highDensityZones = crowdData
    ? Object.entries(crowdData).filter(([, value]) => value > 70)
    : []

  useEffect(() => {
    let isMounted = true

    async function loadCrowdData() {
      try {
        const data = await fetchCrowdData()

        if (!isMounted) {
          return
        }

        setCrowdData(data)
        setIsLoading(false)
        setStatus('Live data refreshes every 2 seconds.')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setIsLoading(false)
        setStatus('Waiting for live data...')
      }
    }

    loadCrowdData()
    const intervalId = setInterval(loadCrowdData, 2000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
                Crowd Intelligence System
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Crowd Intelligence Dashboard
              </h1>
              <p className="max-w-2xl text-base text-slate-400 sm:text-lg">
                {status}
              </p>
            </div>
            {!isLoading && highDensityZones.length > 0 && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-300">
                  Alerts
                </p>
                <div className="mt-3 space-y-2">
                  {highDensityZones.map(([zoneKey]) => (
                    <p key={zoneKey} className="text-sm text-red-100 sm:text-base">
                      High crowd density detected in {zoneLabels[zoneKey]}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {!isLoading && highDensityZones.length === 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Alerts
                </p>
                <p className="mt-3 text-sm text-emerald-100 sm:text-base">
                  No high-density zones detected.
                </p>
              </div>
            )}
            {isLoading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Alerts
                </p>
                <p className="mt-3 text-sm text-slate-400 sm:text-base">
                  Monitoring crowd conditions...
                </p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(zoneLabels).map(([key, label]) => {
                const value = crowdData?.[key]
                const densityStatus =
                  typeof value === 'number' ? getDensityStatus(value) : null

                return (
                  <ZoneCard
                    key={key}
                    label={label}
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
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
