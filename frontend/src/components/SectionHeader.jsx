function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
          {eyebrow}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 via-slate-700 to-transparent" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-slate-400 sm:text-base">{description}</p>
      </div>
    </div>
  )
}

export default SectionHeader
