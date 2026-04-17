import express from 'express';
import mongoose from 'mongoose';
import { Event, VenuePlan } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import { buildVenuePlanZones } from '../utils/venuePlanLayout.js';

const router = express.Router();

const canModifyVenuePlan = (user, event) =>
  user?.role === 'admin' || user?.role === 'staff' || event.organizer?.toString() === user?._id?.toString();

const normalizeEventId = async (eventIdentifier) => {
  const normalizedId = String(eventIdentifier || '').trim();
  const clauses = [{ eventId: normalizedId.toUpperCase() }];

  if (mongoose.Types.ObjectId.isValid(normalizedId)) {
    clauses.unshift({ _id: normalizedId });
  }

  const event = await Event.findOne({
    $or: clauses
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
    const fallbackZones = buildVenuePlanZones(event.zones || [], plan?.zones || []);

    if (!plan) {
      plan = {
        eventId: event.eventId,
        version: 0,
        blueprint: null,
        zones: fallbackZones,
        flowArrows: []
      };
    } else if ((!plan.zones || plan.zones.length === 0) && fallbackZones.length > 0) {
      plan.zones = fallbackZones;
      await plan.save();
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/venue-plan/:eventId
// @desc    Replace full venue plan
router.put('/:eventId', protect, async (req, res) => {
  try {
    const event = await normalizeEventId(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyVenuePlan(req.user, event)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existingPlan = await VenuePlan.findOne({ eventId: event.eventId });
    const { blueprint = undefined, zones = [], flowArrows = [] } = req.body;
    const resolvedZones = Array.isArray(zones) && zones.length > 0
      ? zones
      : buildVenuePlanZones(event.zones || [], existingPlan?.zones || []);
    const resolvedFlowArrows = Array.isArray(flowArrows)
      ? flowArrows
      : existingPlan?.flowArrows || [];

    const plan = await VenuePlan.findOneAndUpdate(
      { eventId: event.eventId },
      {
        $set: {
          eventId: event.eventId,
          ...(blueprint !== undefined
            ? { blueprint }
            : existingPlan?.blueprint !== undefined
              ? { blueprint: existingPlan.blueprint }
              : {}),
          zones: resolvedZones,
          flowArrows: resolvedFlowArrows,
          updatedBy: req.user._id
        },
        $inc: { version: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
router.patch('/:eventId/zones/:zoneId', protect, async (req, res) => {
  try {
    const event = await normalizeEventId(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyVenuePlan(req.user, event)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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
