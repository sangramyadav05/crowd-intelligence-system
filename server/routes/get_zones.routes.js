import express from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const buildEventLookup = (identifier) => {
  const normalizedId = String(identifier || '').trim();
  const clauses = [{ eventId: normalizedId.toUpperCase() }];

  if (mongoose.Types.ObjectId.isValid(normalizedId)) {
    clauses.unshift({ _id: normalizedId });
  }

  return { $or: clauses };
};

const canAccessEvent = (user, event) => {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (String(event.organizer) === String(user._id)) return true;

  return event.coordinators?.some(
    (coordinator) => String(coordinator.userId) === String(user._id)
  );
};

// @route   GET /api/get_zones/:eventId
// @desc    Return simplified zone tuples for surveillance cards
// @access  Private
router.get('/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne(buildEventLookup(req.params.eventId));

    if (!event || !canAccessEvent(req.user, event)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zones = event.zones.map((zone) => [
      zone.name,
      zone.capacity,
      zone.currentCount
    ]);

    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
