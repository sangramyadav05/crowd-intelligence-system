import express from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import surveillanceService from '../services/surveillance/surveillance.service.js';

const router = express.Router();

const buildEventLookup = (identifier) => {
  const normalizedId = String(identifier || '').trim();
  const clauses = [{ eventId: normalizedId.toUpperCase() }];

  if (mongoose.Types.ObjectId.isValid(normalizedId)) {
    clauses.unshift({ _id: normalizedId });
  }

  return { $or: clauses };
};

const canAccessSurveillance = (user, event) => {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (String(event.organizer) === String(user._id)) return true;

  return event.coordinators?.some(
    (coordinator) => String(coordinator.userId) === String(user._id)
  );
};

// @route   GET /api/surveillance/:eventId/overview
// @desc    Get surveillance readiness overview for an event
// @access  Private
router.get('/:eventId/overview', protect, async (req, res) => {
  try {
    const event = await Event.findOne(buildEventLookup(req.params.eventId));

    if (!event || !canAccessSurveillance(req.user, event)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const overview = await surveillanceService.getOverview(event);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/surveillance/:eventId/heatmap
// @desc    Get heatmap-ready zone outputs for an event
// @access  Private
router.get('/:eventId/heatmap', protect, async (req, res) => {
  try {
    const event = await Event.findOne(buildEventLookup(req.params.eventId));

    if (!event || !canAccessSurveillance(req.user, event)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const heatmap = await surveillanceService.getHeatmap(event);
    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
