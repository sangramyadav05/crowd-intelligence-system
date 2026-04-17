import express from 'express';
import { Event, CrowdData, Alert } from '../models/index.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// @route   POST /api/public/lookup
// @desc    Look up event by access code
// @access  Public
router.post('/lookup', async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }

    const event = await Event.findOne({
      accessCode: accessCode.toUpperCase(),
      isPublic: true
    }).select('-organizer');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is active
    const now = new Date();
    if (now < event.startTime || now > event.endTime) {
      return res.json({
        event: {
          _id: event._id,
          name: event.name,
          status: event.getStatus(),
          startTime: event.startTime,
          endTime: event.endTime
        },
        message: 'Event is not currently active'
      });
    }

    // Get current crowd data
    const zoneData = event.zones.map(zone => ({
      zoneId: zone._id,
      name: zone.name,
      currentCount: zone.currentCount,
      capacity: zone.capacity,
      occupancy: Math.round((zone.currentCount / zone.capacity) * 100),
      status: zone.currentCount > zone.capacity ? 'overcrowded' : 
              zone.currentCount > zone.capacity * 0.8 ? 'busy' : 'normal',
      coordinates: zone.coordinates
    }));

    // Get active alerts
    const activeAlerts = await Alert.find({
      event: event._id,
      isResolved: false,
      severity: { $in: ['warning', 'critical', 'emergency'] }
    }).sort({ createdAt: -1 }).limit(5);

    // Get AI recommendations for public safety
    const recommendations = await aiService.generateRecommendations(event._id);

    res.json({
      event: {
        _id: event._id,
        name: event.name,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        accessCode: event.accessCode
      },
      zones: zoneData,
      totalCrowd: event.getTotalCrowd(),
      totalCapacity: event.zones.reduce((sum, z) => sum + z.capacity, 0),
      alerts: activeAlerts.map(alert => ({
        severity: alert.severity,
        message: alert.message,
        recommendedAction: alert.recommendedAction
      })),
      recommendations: recommendations.filter(r => r.type !== 'evacuation_needed'),
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/public/event/:id/status
// @desc    Get real-time crowd status for public view
// @access  Public (with valid event)
router.get('/event/:id/status', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isPublic) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update crowd counts (simulate or get real data)
    // This could be triggered by sensors or manual updates

    const zoneData = event.zones.map(zone => ({
      zoneId: zone._id,
      name: zone.name,
      currentCount: zone.currentCount,
      capacity: zone.capacity,
      occupancy: Math.round((zone.currentCount / zone.capacity) * 100),
      status: zone.currentCount > zone.capacity ? 'avoid' : 
              zone.currentCount > zone.capacity * 0.8 ? 'busy' : 'safe',
      coordinates: zone.coordinates
    }));

    // Determine overall event status
    const maxOccupancy = Math.max(...zoneData.map(z => z.occupancy));
    let overallStatus = 'safe';
    if (maxOccupancy > 95) overallStatus = 'critical';
    else if (maxOccupancy > 80) overallStatus = 'high';
    else if (maxOccupancy > 60) overallStatus = 'moderate';

    res.json({
      event: {
        _id: event._id,
        name: event.name
      },
      zones: zoneData,
      overallStatus,
      totalCrowd: event.getTotalCrowd(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/public/event/:id/subscribe
// @desc    Subscribe to real-time updates for an event
// @access  Public
router.post('/event/:id/subscribe', async (req, res) => {
  try {
    const { socketId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event || !event.isPublic) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Client will join the socket room on their end
    res.json({
      message: 'Subscribed to event updates',
      eventId: event._id,
      eventName: event.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
