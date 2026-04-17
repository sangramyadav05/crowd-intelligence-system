import { useEffect, useState } from 'react'
import ZoneCard from '../components/ZoneCard'
import { fetchCrowdData } from '../services/crowdApi'

const zoneLabels = {
  zoneA: 'Zone A',
  zoneB: 'Zone B',
  zoneC: 'Zone C',
}

function Dashboard() {
  const [crowdData, setCrowdData] = useState(null)
  const [status, setStatus] = useState('Waiting for live data...')

  useEffect(() => {
    let isMounted = true

    async function loadCrowdData() {
      try {
        const data = await fetchCrowdData()

        if (!isMounted) {
          return
        }

        setCrowdData(data)
        setStatus('Live API connection established.')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus('Waiting for live data...')
      }
    }

    loadCrowdData()

    return () => {
      isMounted = false
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
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(zoneLabels).map(([key, label]) => (
                <ZoneCard
                  key={key}
                  label={label}
                  value={crowdData ? crowdData[key] : '--'}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
