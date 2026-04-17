import express from 'express';
import { Event, VenuePlan } from '../models/index.js';
import { protect, staffOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

const normalizeEventId = async (eventIdentifier) => {
  const event = await Event.findOne({
    $or: [
      { eventId: String(eventIdentifier).toUpperCase() },
      { _id: eventIdentifier }
    ]
  });
  return event;
};

// @route   GET /api/venue-plan/:eventId
// @desc    Get venue plan by event
router.get('/:eventId', async (req, res) => {
  try {
    const event = await normalizeEventId(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let plan = await VenuePlan.findOne({ eventId: event.eventId });
    if (!plan) {
      plan = {
        eventId: event.eventId,
        version: 0,
        zones: [],
        flowArrows: []
      };
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/venue-plan/:eventId
// @desc    Replace full venue plan
router.put('/:eventId', protect, staffOrAdmin, async (req, res) => {
  try {
    const event = await normalizeEventId(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { zones = [], flowArrows = [] } = req.body;
    const plan = await VenuePlan.findOneAndUpdate(
      { eventId: event.eventId },
      {
        eventId: event.eventId,
        zones,
        flowArrows,
        updatedBy: req.user._id,
        $inc: { version: 1 }
      },
      { upsert: true, new: true }
    );

    req.emitRealtime?.(event.eventId, 'event_plan_update', {
      eventId: event.eventId,
      version: plan.version,
      zones: plan.zones,
      flowArrows: plan.flowArrows
    });

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/venue-plan/:eventId/zones/:zoneId
// @desc    Update individual zone properties
router.patch('/:eventId/zones/:zoneId', protect, staffOrAdmin, async (req, res) => {
  try {
    const event = await normalizeEventId(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const plan = await VenuePlan.findOne({ eventId: event.eventId });
    if (!plan) return res.status(404).json({ message: 'Venue plan not found' });

    const zone = plan.zones.find((item) => item.zoneId === req.params.zoneId);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    const wasEmergencyOnly = zone.emergencyExitOnly;
    Object.assign(zone, req.body);
    plan.updatedBy = req.user._id;
    plan.version += 1;
    await plan.save();

    req.emitRealtime?.(event.eventId, 'event_plan_update', {
      eventId: event.eventId,
      version: plan.version,
      zone
    });

    if (!wasEmergencyOnly && zone.emergencyExitOnly) {
      req.emitRealtime?.(event.eventId, 'notifications', {
        type: 'high_priority',
        message: `Zone "${zone.name}" is now emergency exit only`,
        severity: 'critical'
      });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
