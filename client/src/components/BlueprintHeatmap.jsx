import { useState } from 'react'

const STATUS_STYLES = {
  safe: {
    fill: 'rgba(34, 197, 94, 0.26)',
    glow: 'rgba(34, 197, 94, 0.18)',
    stroke: '#15803d',
    badge: 'bg-green-100 text-green-700 border-green-200'
  },
  busy: {
    fill: 'rgba(249, 115, 22, 0.26)',
    glow: 'rgba(249, 115, 22, 0.18)',
    stroke: '#c2410c',
    badge: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  overcrowded: {
    fill: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.2)',
    stroke: '#b91c1c',
    badge: 'bg-red-100 text-red-700 border-red-200'
  }
}

const DEFAULT_STYLE = STATUS_STYLES.safe

const getPolygonCenter = (polygon = []) => {
  if (!polygon.length) return { x: 50, y: 50 }

  const { totalX, totalY } = polygon.reduce((accumulator, point) => ({
    totalX: accumulator.totalX + Number(point.x || 0),
    totalY: accumulator.totalY + Number(point.y || 0)
  }), { totalX: 0, totalY: 0 })

  return {
    x: totalX / polygon.length,
    y: totalY / polygon.length
  }
}

export default function BlueprintHeatmap({
  blueprint,
  zones = [],
  selectedZoneId = '',
  onSelectZone,
  title = 'Venue Heatmap',
  subtitle = 'Live zone intensity overlay'
}) {
  const [imageAspectRatio, setImageAspectRatio] = useState('16 / 10')

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Safe
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Busy
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Overcrowded
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
        <div
          className="relative"
          style={{ aspectRatio: blueprint?.imageData ? imageAspectRatio : '16 / 10' }}
        >
          {blueprint?.imageData ? (
            <img
              src={blueprint.imageData}
              alt={blueprint.fileName || 'Venue blueprint'}
              className="absolute inset-0 h-full w-full object-fill"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget
                if (naturalWidth && naturalHeight) {
                  setImageAspectRatio(`${naturalWidth} / ${naturalHeight}`)
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)]">
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                Upload a venue blueprint to replace this placeholder canvas
              </div>
            </div>
          )}

          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            {zones.map((zone) => {
              const style = STATUS_STYLES[zone.statusKey] || DEFAULT_STYLE
              const isSelected = selectedZoneId === zone.id
              const center = getPolygonCenter(zone.polygon)

              return (
                <g key={zone.id}>
                  <polygon
                    points={zone.polygon.map((point) => `${point.x},${point.y}`).join(' ')}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={isSelected ? 1.1 : 0.7}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectZone?.(zone.id)}
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={isSelected ? 3.2 : 2.4}
                    fill={style.glow}
                    stroke={style.stroke}
                    strokeWidth={isSelected ? 0.45 : 0.22}
                    className="pointer-events-none"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={isSelected ? 1.7 : 1.25}
                    fill={style.stroke}
                    className="pointer-events-none"
                  />
                  <text
                    x={center.x}
                    y={center.y - 2.6}
                    textAnchor="middle"
                    className="fill-white text-[3.8px] font-semibold tracking-[0.08em]"
                  >
                    {zone.name}
                  </text>
                  <text
                    x={center.x}
                    y={center.y + 3.2}
                    textAnchor="middle"
                    className="fill-white/90 text-[3px]"
                  >
                    {zone.occupancy}%
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {zones.map((zone) => {
          const style = STATUS_STYLES[zone.statusKey] || DEFAULT_STYLE
          const isSelected = selectedZoneId === zone.id

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelectZone?.(zone.id)}
              className={`rounded-2xl border px-3 py-2 text-left transition ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="text-sm font-semibold">{zone.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={`inline-flex rounded-full border px-2 py-0.5 ${isSelected ? 'border-white/20 bg-white/10 text-white' : style.badge}`}>
                  {zone.statusLabel}
                </span>
                <span>{zone.currentCount}/{zone.capacity}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
