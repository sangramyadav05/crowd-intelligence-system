export const zoneConfig = {
  zoneA: {
    label: 'Zone A',
    coordinates: [28.6139, 77.209],
  },
  zoneB: {
    label: 'Zone B',
    coordinates: [28.6155, 77.2122],
  },
  zoneC: {
    label: 'Zone C',
    coordinates: [28.6116, 77.2144],
  },
}

export function getDensityStatus(value) {
  if (value <= 30) {
    return {
      label: 'Low',
      classes: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
      color: '#22c55e',
    }
  }

  if (value <= 70) {
    return {
      label: 'Medium',
      classes: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
      color: '#facc15',
    }
  }

  return {
    label: 'High',
    classes: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
    color: '#ef4444',
  }
}
