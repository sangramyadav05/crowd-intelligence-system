import { Prediction, Alert, CrowdData, Event } from '../models/index.js';

/**
 * AI Service for crowd prediction and anomaly detection
 * This is a simulation service that can be replaced with real ML models
 */

class AIService {
  /**
   * Predict crowd count for a specific time in the future
   * @param {string} eventId - Event ID
   * @param {string} zoneId - Zone ID
   * @param {number} minutesAhead - Minutes to predict ahead (5-30)
   */
  async predictCrowd(eventId, zoneId, minutesAhead = 15) {
    try {
      // Get recent crowd data (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentData = await CrowdData.find({
        event: eventId,
        zoneId,
        timestamp: { $gte: thirtyMinutesAgo }
      }).sort({ timestamp: 1 });

      if (recentData.length < 3) {
        return null;
      }

      const currentCount = recentData[recentData.length - 1].count;
      
      // Calculate trend using linear regression simulation
      const trend = this._calculateTrend(recentData);
      
      // Predict count based on trend
      const predictedCount = Math.max(0, Math.round(
        currentCount + (trend * minutesAhead)
      ));

      // Calculate confidence based on data quality
      const confidence = Math.min(0.95, 0.5 + (recentData.length / 60) * 0.5);

      // Determine risk level
      const event = await Event.findById(eventId);
      const zone = event.zones.find(z => z._id.toString() === zoneId);
      const capacity = zone?.capacity || 100;
      const occupancyAtPrediction = predictedCount / capacity;
      
      let riskLevel = 'low';
      if (occupancyAtPrediction > 0.9) riskLevel = 'critical';
      else if (occupancyAtPrediction > 0.8) riskLevel = 'high';
      else if (occupancyAtPrediction > 0.6) riskLevel = 'medium';

      // Create prediction record
      const prediction = await Prediction.create({
        event: eventId,
        zoneId,
        predictedTime: new Date(Date.now() + minutesAhead * 60 * 1000),
        predictedCount,
        confidence,
        trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
        riskLevel,
        factors: [
          { name: 'recent_growth_rate', impact: Math.min(1, Math.abs(trend) / 10) },
          { name: 'data_quality', impact: confidence - 0.5 },
          { name: 'time_of_day', impact: this._getTimeImpact() }
        ]
      });

      return prediction;
    } catch (error) {
      console.error('AI Prediction error:', error);
      return null;
    }
  }

  /**
   * Detect anomalies in crowd patterns
   */
  async detectAnomalies(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return [];

      const anomalies = [];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      for (const zone of event.zones) {
        // Get recent data for this zone
        const recentData = await CrowdData.find({
          event: eventId,
          zoneId: zone._id.toString(),
          timestamp: { $gte: fiveMinutesAgo }
        }).sort({ timestamp: -1 });

        if (recentData.length === 0) continue;

        const currentCount = zone.currentCount;
        const capacity = zone.capacity;
        const occupancyRate = currentCount / capacity;

        // Check for critical capacity
        if (occupancyRate > 0.95) {
          anomalies.push({
            zoneId: zone._id.toString(),
            type: 'capacity_critical',
            severity: 'emergency',
            message: `Zone "${zone.name}" is at ${Math.round(occupancyRate * 100)}% capacity!`,
            recommendedAction: 'Immediate crowd dispersal required'
          });
        }
        // Check for rapid increase
        else if (recentData.length >= 2) {
          const previousCount = recentData[recentData.length - 1].count;
          const increaseRate = (currentCount - previousCount) / previousCount;
          
          if (increaseRate > 0.3) { // 30% increase in 5 minutes
            anomalies.push({
              zoneId: zone._id.toString(),
              type: 'rapid_increase',
              severity: 'warning',
              message: `Rapid crowd surge detected in "${zone.name}"`,
              recommendedAction: 'Monitor closely and prepare for dispersal'
            });
          }
        }
        // Check for unusual patterns (sudden drop)
        else if (recentData.length >= 3) {
          const avgCount = recentData.reduce((sum, d) => sum + d.count, 0) / recentData.length;
          const variance = recentData.reduce((sum, d) => sum + Math.pow(d.count - avgCount, 2), 0) / recentData.length;
          
          if (variance > avgCount * 2) { // High variance indicates unusual activity
            anomalies.push({
              zoneId: zone._id.toString(),
              type: 'unusual_pattern',
              severity: 'info',
              message: `Unusual crowd pattern detected in "${zone.name}"`,
              recommendedAction: 'Review security footage'
            });
          }
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Generate movement recommendations for crowd flow optimization
   */
  async generateRecommendations(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event || event.zones.length < 2) return [];

      const recommendations = [];
      const zoneStatuses = event.zones.map(zone => ({
        zone,
        occupancy: zone.currentCount / zone.capacity,
        available: zone.capacity - zone.currentCount
      }));

      // Find overcrowded and underutilized zones
      const overcrowded = zoneStatuses.filter(z => z.occupancy > 0.8);
      const underutilized = zoneStatuses.filter(z => z.occupancy < 0.4);

      if (overcrowded.length > 0 && underutilized.length > 0) {
        recommendations.push({
          type: 'redistribute',
          priority: 'high',
          message: `Redirect crowd from ${overcrowded.map(z => z.zone.name).join(', ')} to ${underutilized.map(z => z.zone.name).join(', ')}`,
          details: {
            from: overcrowded.map(z => ({ name: z.zone.name, occupancy: Math.round(z.occupancy * 100) })),
            to: underutilized.map(z => ({ name: z.zone.name, occupancy: Math.round(z.occupancy * 100) }))
          }
        });
      }

      // Suggest entry/exit management
      const entryZones = zoneStatuses.filter(z => z.zone.name.toLowerCase().includes('entrance') || 
                                                   z.zone.name.toLowerCase().includes('gate'));
      if (entryZones.some(z => z.occupancy > 0.7)) {
        recommendations.push({
          type: 'entry_control',
          priority: 'medium',
          message: 'Consider staggered entry to prevent congestion at entrances'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return [];
    }
  }

  // Helper: Calculate trend from data points
  _calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    data.forEach((point, i) => {
      sumX += i;
      sumY += point.count;
      sumXY += i * point.count;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  // Helper: Get time-based impact factor
  _getTimeImpact() {
    const hour = new Date().getHours();
    // Peak hours typically have higher crowd volatility
    if ((hour >= 18 && hour <= 22) || (hour >= 12 && hour <= 14)) {
      return 0.2;
    }
    return 0;
  }
}

export default new AIService();
