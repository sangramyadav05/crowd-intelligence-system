import CountUp from 'react-countup'

function ZoneCard({
  label,
  value,
  densityLabel,
  densityClasses,
  valueCaption = 'Number of people',
}) {
  const isNumeric = typeof value === 'number'
  const isHighDensity = densityLabel === 'High'

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-950/30 ${
        isHighDensity ? 'dashboard-glow-red' : ''
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_45%)] opacity-60 transition duration-300 group-hover:opacity-100" />
      <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${densityClasses}`}
        >
          {densityLabel}
        </span>
      </div>
      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {isNumeric ? <CountUp end={value} duration={1.2} separator="," /> : value}
        </p>
        <div className="h-12 w-12 rounded-2xl border border-white/6 bg-white/5" />
      </div>
      <p className="mt-3 text-sm text-slate-400">{valueCaption}</p>
      </div>
    </article>
  )
}

export default ZoneCard
