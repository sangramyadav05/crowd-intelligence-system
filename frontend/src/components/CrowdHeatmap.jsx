import SectionHeader from './SectionHeader'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { getDensityStatus, zoneConfig } from '../utils/crowdConfig'

const mapCenter = [28.6139, 77.2119]

function getMarkerRadius(value) {
  return Math.max(12, Math.min(34, 10 + value / 3))
}

function CrowdHeatmap({ crowdData, isLoading }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Spatial View"
        title="Crowd Density Map"
        description="Real-time zone intensity is shown through marker size and color across the monitored venue."
      />
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-3 shadow-2xl shadow-slate-950/50">
        <MapContainer
          center={mapCenter}
          zoom={15}
          scrollWheelZoom={false}
          className="h-[380px] w-full rounded-[1.25rem] bg-slate-950"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {Object.entries(zoneConfig).map(([zoneKey, zone]) => {
            const value = crowdData?.[zoneKey] ?? 0
            const densityStatus = getDensityStatus(value)

            return (
              <CircleMarker
                key={zoneKey}
                center={zone.coordinates}
                radius={isLoading ? 12 : getMarkerRadius(value)}
                pathOptions={{
                  color: densityStatus.color,
                  fillColor: densityStatus.color,
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{zone.label}</p>
                    <p className="text-sm text-slate-700">
                      {isLoading ? 'Loading...' : `${value} people`}
                    </p>
                    <p className="text-sm text-slate-700">
                      Density: {isLoading ? 'Pending' : densityStatus.label}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </section>
  )
}

export default CrowdHeatmap
