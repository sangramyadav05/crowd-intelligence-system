import express from 'express';
import { Event, CrowdData, Alert } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// @route   POST /api/crowd/update/:eventId
// @desc    Update crowd count for a zone (simulation or real data)
// @access  Private
router.post('/update/:eventId', protect, async (req, res) => {
  try {
    const { zoneId, count, source = 'manual' } = req.body;
    const eventId = req.params.eventId;

    const event = await Event.findOne({
      _id: eventId,
      $or: [
        { organizer: req.user._id },
        { 'zones._id': zoneId }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zone = event.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    // Update zone count
    const oldCount = zone.currentCount;
    zone.currentCount = Math.max(0, count);

    // Create crowd data record
    const crowdData = await CrowdData.create({
      event: eventId,
      zoneId,
      count: zone.currentCount,
      source,
      timestamp: new Date()
    });

    // Check for alerts
    const capacity = zone.capacity;
    const occupancy = zone.currentCount / capacity;

    if (occupancy > 0.9 && !zone.alerts.some(a => a.type === 'critical' && new Date() - a.timestamp < 5 * 60 * 1000)) {
      await Alert.create({
        event: eventId,
        zoneId,
        type: 'capacity_critical',
        severity: 'emergency',
        title: 'Critical Capacity Alert',
        message: `Zone "${zone.name}" has reached ${Math.round(occupancy * 100)}% capacity!`,
        crowdCount: zone.currentCount,
        capacity,
        occupancyPercent: Math.round(occupancy * 100),
        recommendedAction: 'Immediate crowd control measures required'
      });

      zone.alerts.push({
        type: 'critical',
        message: `Capacity critical: ${Math.round(occupancy * 100)}%`,
        timestamp: new Date()
      });
    } else if (occupancy > 0.8 && !zone.alerts.some(a => a.type === 'warning' && new Date() - a.timestamp < 10 * 60 * 1000)) {
      await Alert.create({
        event: eventId,
        zoneId,
        type: 'capacity_warning',
        severity: 'warning',
        title: 'High Capacity Warning',
        message: `Zone "${zone.name}" is at ${Math.round(occupancy * 100)}% capacity.`,
        crowdCount: zone.currentCount,
        capacity,
        occupancyPercent: Math.round(occupancy * 100),
        recommendedAction: 'Monitor closely and prepare dispersal plan'
      });

      zone.alerts.push({
        type: 'warning',
        message: `Capacity warning: ${Math.round(occupancy * 100)}%`,
        timestamp: new Date()
      });
    }

    await event.save();

    // Emit realtime updates for both legacy and namespace contracts.
    const densityPayload = {
      zoneId,
      count: zone.currentCount,
      occupancy: Math.round(occupancy * 100),
      timestamp: new Date()
    };
    req.io.to(`event-${eventId}`).emit('crowd-update', densityPayload);
    const emitKey = event.eventId || eventId;
    req.emitRealtime?.(emitKey, 'density_update', densityPayload);
    req.emitRealtime?.(emitKey, 'notifications', {
      type: 'density',
      severity: occupancy > 0.9 ? 'emergency' : occupancy > 0.8 ? 'warning' : 'info',
      ...densityPayload
    });

    res.json({
      zone,
      crowdData,
      alert: occupancy > 0.8 ? { severity: occupancy > 0.9 ? 'emergency' : 'warning', occupancy } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/crowd/history/:eventId
// @desc    Get crowd history for an event
// @access  Private
router.get('/history/:eventId', protect, async (req, res) => {
  try {
    const { zoneId, hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const query = {
      event: req.params.eventId,
      timestamp: { $gte: since }
    };

    if (zoneId) query.zoneId = zoneId;

    const history = await CrowdData.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/crowd/simulate/:eventId
// @desc    Run crowd simulation for all zones
// @access  Private
router.post('/simulate/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const results = [];

    for (const zone of event.zones) {
      // Simulate realistic crowd changes
      const baseChange = Math.floor(Math.random() * 20) - 8; // -8 to +12
      const surge = Math.random() < 0.15 ? Math.floor(Math.random() * 30) + 10 : 0;
      const change = baseChange + surge;

      const newCount = Math.max(0, Math.min(zone.capacity + 20, zone.currentCount + change));

      zone.currentCount = newCount;

      await CrowdData.create({
        event: event._id,
        zoneId: zone._id.toString(),
        count: newCount,
        source: 'simulated',
        timestamp: new Date()
      });

      results.push({
        zoneId: zone._id,
        zoneName: zone.name,
        count: newCount,
        capacity: zone.capacity,
        occupancy: Math.round((newCount / zone.capacity) * 100)
      });

      // Emit update
      const densityPayload = {
        zoneId: zone._id.toString(),
        count: newCount,
        occupancy: Math.round((newCount / zone.capacity) * 100),
        timestamp: new Date()
      };
      req.io.to(`event-${event._id}`).emit('crowd-update', densityPayload);
      req.emitRealtime?.(event._id.toString(), 'density_update', densityPayload);
    }

    await event.save();

    res.json({
      message: 'Simulation completed',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/crowd/reset/:eventId
// @desc    Reset all zone counts to 0
// @access  Private
router.post('/reset/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    for (const zone of event.zones) {
      zone.currentCount = 0;
      zone.alerts = [];
    }

    await event.save();

    // Create reset record
    for (const zone of event.zones) {
      await CrowdData.create({
        event: event._id,
        zoneId: zone._id.toString(),
        count: 0,
        source: 'manual',
        timestamp: new Date()
      });
    }

    // Broadcast reset
    req.io.to(`event-${event._id}`).emit('crowd-reset', {
      timestamp: new Date()
    });
    req.emitRealtime?.(event._id.toString(), 'density_update', {
      reset: true,
      timestamp: new Date()
    });

    res.json({ message: 'All zone counts reset to 0' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
