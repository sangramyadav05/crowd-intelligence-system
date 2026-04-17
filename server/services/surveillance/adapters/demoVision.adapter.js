import { CrowdData, VenuePlan } from '../../../models/index.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildGeneratedRectangle = (index, total) => {
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(total || 1))));
  const rows = Math.max(1, Math.ceil((total || 1) / columns));
  const cellWidth = 100 / columns;
  const cellHeight = 100 / rows;
  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    type: 'rectangle',
    x: Number((col * cellWidth + 4).toFixed(2)),
    y: Number((row * cellHeight + 4).toFixed(2)),
    width: Number(Math.max(cellWidth - 8, 18).toFixed(2)),
    height: Number(Math.max(cellHeight - 8, 18).toFixed(2))
  };
};

class DemoVisionAdapter {
  async capture(event) {
    const capturedAt = new Date();
    const lookbackStart = new Date(Date.now() - 30 * 60 * 1000);
    const [recentSamples, venuePlan] = await Promise.all([
      CrowdData.find({
        event: event._id,
        timestamp: { $gte: lookbackStart }
      })
        .sort({ timestamp: -1 })
        .limit(240)
        .lean(),
      event.eventId ? VenuePlan.findOne({ eventId: event.eventId }).lean() : null
    ]);

    const samplesByZone = new Map();
    recentSamples.forEach((sample) => {
      const zoneKey = String(sample.zoneId);
      if (!samplesByZone.has(zoneKey)) samplesByZone.set(zoneKey, []);
      samplesByZone.get(zoneKey).push(sample);
    });

    const zoneSnapshots = event.zones.map((zone, index) => {
      const zoneKey = String(zone._id);
      const planZone = venuePlan?.zones?.find((item) => item.zoneId === zoneKey);
      const zoneSamples = samplesByZone.get(zoneKey) || [];
      const latestSample = zoneSamples[0] || null;
      const oldestSample = zoneSamples[zoneSamples.length - 1] || null;
      const baselineCount = oldestSample?.count ?? zone.currentCount;
      const occupancyPercent = zone.capacity > 0
        ? Math.round((zone.currentCount / zone.capacity) * 100)
        : 0;
      const trendDelta = zone.currentCount - baselineCount;
      const signalQuality = clamp(58 + zoneSamples.length * 7, 58, 98);
      const movementIndex = clamp(
        Math.round(
          Math.abs(latestSample?.flowRate || 0) * 12
          + Math.abs(latestSample?.velocity || 0) * 18
          + Math.max(trendDelta, 0) * 2
        ),
        8,
        100
      );
      const intensityScore = clamp(
        Math.round((occupancyPercent * 0.72) + (movementIndex * 0.28)),
        0,
        100
      );

      let pressureBand = 'stable';
      if (intensityScore >= 85) pressureBand = 'critical';
      else if (intensityScore >= 65) pressureBand = 'watch';
      else if (trendDelta > 10) pressureBand = 'building';

      return {
        zoneId: zoneKey,
        name: zone.name,
        currentCount: zone.currentCount,
        capacity: zone.capacity,
        occupancyPercent,
        trendDelta,
        signalQuality,
        movementIndex,
        intensityScore,
        pressureBand,
        geometry: planZone?.polygon?.length
          ? { type: 'polygon', points: planZone.polygon }
          : buildGeneratedRectangle(index, event.zones.length),
        source: latestSample?.source || 'simulated',
        lastSampleAt: latestSample?.timestamp || capturedAt,
        maxCapacity: planZone?.maxCapacity || zone.capacity,
        congestionThreshold: planZone?.congestionThreshold || 80
      };
    });

    const averageSignalQuality = zoneSnapshots.length
      ? Math.round(
          zoneSnapshots.reduce((sum, zone) => sum + zone.signalQuality, 0) / zoneSnapshots.length
        )
      : 0;

    return {
      adapterId: 'demo-vision',
      adapterLabel: 'Demo Vision Adapter',
      mode: 'derived-live',
      captureIntervalSeconds: 15,
      activeFeeds: Math.max(1, Math.min(event.zones.length, 4)),
      averageSignalQuality,
      capturedAt,
      venuePlan,
      zoneSnapshots
    };
  }
}

export default new DemoVisionAdapter();
