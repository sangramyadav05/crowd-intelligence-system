function ZoneCard({ label, value, densityLabel, densityClasses }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${densityClasses}`}
        >
          {densityLabel}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">Number of people</p>
    </article>
  )
}

export default ZoneCard
