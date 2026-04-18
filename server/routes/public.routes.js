import express from 'express';
import { Event, CrowdData, Alert, EventMessage } from '../models/index.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

const mapPublicFeedMessage = (message) => ({
  id: message._id,
  type: message.type,
  text: message.text,
  byRole: message.fromRole,
  by: message.from,
  at: message.createdAt
});

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

    const now = new Date();
    const isLive = now >= event.startTime && now <= event.endTime;

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
    const activeAlerts = isLive
      ? await Alert.find({
          event: event._id,
          isResolved: false,
          severity: { $in: ['warning', 'critical', 'emergency'] }
        }).sort({ createdAt: -1 }).limit(5)
      : [];

    // Get AI recommendations for public safety
    const recommendations = isLive
      ? await aiService.generateRecommendations(event._id)
      : [];

    res.json({
      event: {
        _id: event._id,
        eventId: event.eventId,
        name: event.name,
        status: event.getStatus(),
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
      lastUpdated: new Date(),
      isLive,
      message: isLive ? '' : 'Event is not currently active. Live crowd counts will update once it starts.'
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
        eventId: event.eventId,
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

// @route   POST /api/public/event/:id/questions
// @desc    Submit a crowd question to staff/admin feed
// @access  Public
router.post('/event/:id/questions', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.isPublic) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { message, zoneId = null, from = 'crowd' } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Question message is required' });
    }

    const roomEventId = event.eventId || event._id.toString();
    const eventMessage = await EventMessage.create({
      event: event._id,
      eventId: roomEventId,
      zoneId,
      type: 'question',
      text: message.trim(),
      from,
      fromRole: 'crowd'
    });

    const payload = {
      id: eventMessage._id,
      eventId: roomEventId,
      zoneId,
      question: eventMessage.text,
      from,
      timestamp: eventMessage.createdAt
    };

    req.emitRealtime?.(roomEventId, 'gathering_question', payload);
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/public/event/:id/feed
// @desc    Get recent coordinator answers for public view
// @access  Public
router.get('/event/:id/feed', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.isPublic) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const messages = await EventMessage.find({
      event: event._id,
      type: 'answer'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(messages.map(mapPublicFeedMessage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
