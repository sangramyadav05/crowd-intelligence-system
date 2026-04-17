import aiService from '../ai.service.js';
import demoVisionAdapter from './adapters/demoVision.adapter.js';

const heatToneFromScore = (score) => {
  if (score >= 85) {
    return {
      name: 'critical',
      fill: 'rgba(239, 68, 68, 0.92)',
      surface: 'bg-red-50 border-red-200',
      text: 'text-red-700'
    };
  }
  if (score >= 65) {
    return {
      name: 'watch',
      fill: 'rgba(245, 158, 11, 0.85)',
      surface: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700'
    };
  }
  if (score >= 45) {
    return {
      name: 'active',
      fill: 'rgba(59, 130, 246, 0.8)',
      surface: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700'
    };
  }
  return {
    name: 'calm',
    fill: 'rgba(16, 185, 129, 0.78)',
    surface: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700'
  };
};

const summarizeBehaviorFlags = (zoneSnapshots, anomalies) => {
  const flags = [];

  zoneSnapshots.forEach((zone) => {
    if (zone.intensityScore >= 85) {
      flags.push({
        zoneId: zone.zoneId,
        zoneName: zone.name,
        severity: 'critical',
        label: 'Critical density',
        detail: `${zone.occupancyPercent}% occupied with elevated movement`
      });
      return;
    }

    if (zone.trendDelta >= 12) {
      flags.push({
        zoneId: zone.zoneId,
        zoneName: zone.name,
        severity: 'warning',
        label: 'Crowd surge building',
        detail: `Count increased by ${zone.trendDelta} during the recent capture window`
      });
    }
  });

  anomalies.forEach((anomaly) => {
    flags.push({
      zoneId: anomaly.zoneId,
      zoneName: zoneSnapshots.find((zone) => zone.zoneId === anomaly.zoneId)?.name || anomaly.zoneId,
      severity: anomaly.severity || 'info',
      label: anomaly.type?.replaceAll('_', ' ') || 'anomaly',
      detail: anomaly.message
    });
  });

  return flags.slice(0, 6);
};

class SurveillanceService {
  async getOverview(event) {
    const [capture, anomalies, recommendations] = await Promise.all([
      demoVisionAdapter.capture(event),
      aiService.detectAnomalies(event._id),
      aiService.generateRecommendations(event._id)
    ]);

    const hotZones = capture.zoneSnapshots.filter((zone) => zone.intensityScore >= 65);
    const flags = summarizeBehaviorFlags(capture.zoneSnapshots, anomalies);

    return {
      generatedAt: capture.capturedAt,
      event: {
        id: event._id,
        eventId: event.eventId,
        name: event.name
      },
      ingestion: {
        adapterId: capture.adapterId,
        adapterLabel: capture.adapterLabel,
        mode: capture.mode,
        activeFeeds: capture.activeFeeds,
        averageSignalQuality: capture.averageSignalQuality,
        lastCaptureAt: capture.capturedAt
      },
      summary: {
        trackedCrowd: event.getTotalCrowd(),
        zonesTracked: capture.zoneSnapshots.length,
        hotZones: hotZones.length,
        activeFlags: flags.length
      },
      zones: capture.zoneSnapshots.map((zone) => ({
        zoneId: zone.zoneId,
        name: zone.name,
        currentCount: zone.currentCount,
        capacity: zone.capacity,
        occupancyPercent: zone.occupancyPercent,
        signalQuality: zone.signalQuality,
        movementIndex: zone.movementIndex,
        intensityScore: zone.intensityScore,
        pressureBand: zone.pressureBand,
        source: zone.source,
        lastSampleAt: zone.lastSampleAt,
        tone: heatToneFromScore(zone.intensityScore)
      })),
      behaviorFlags: flags,
      recommendations: recommendations.slice(0, 3)
    };
  }

  async getHeatmap(event) {
    const capture = await demoVisionAdapter.capture(event);

    return {
      generatedAt: capture.capturedAt,
      layout: {
        mode: capture.venuePlan?.zones?.length ? 'venue-plan' : 'generated-grid',
        coordinateSpace: '0-100 normalized canvas'
      },
      legend: [
        { label: 'Calm', range: '0-44', tone: heatToneFromScore(20) },
        { label: 'Active', range: '45-64', tone: heatToneFromScore(50) },
        { label: 'Watch', range: '65-84', tone: heatToneFromScore(70) },
        { label: 'Critical', range: '85-100', tone: heatToneFromScore(90) }
      ],
      cells: capture.zoneSnapshots.map((zone) => ({
        zoneId: zone.zoneId,
        label: zone.name,
        currentCount: zone.currentCount,
        capacity: zone.capacity,
        occupancyPercent: zone.occupancyPercent,
        intensityScore: zone.intensityScore,
        movementIndex: zone.movementIndex,
        pressureBand: zone.pressureBand,
        geometry: zone.geometry,
        tone: heatToneFromScore(zone.intensityScore)
      }))
    };
  }
}

export default new SurveillanceService();
