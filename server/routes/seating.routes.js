import express from 'express';
import { Event, SeatingLayout } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const canModifyLayout = (user, event) =>
  user?.role === 'admin' || user?.role === 'staff' || event.organizer.toString() === user._id.toString();

const buildDefaultZonesFromEvent = (event) => event.zones.map((zone) => ({
  zoneId: zone._id.toString(),
  name: zone.name,
  rows: 1,
  seatsPerRow: Math.max(1, Math.floor(zone.capacity / 10)),
  seats: []
}));

// @route   GET /api/seating/:eventId
// @desc    Get seating layout for event
// @access  Private
router.get('/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyLayout(req.user, event)) return res.status(403).json({ message: 'Not authorized' });

    let layout = await SeatingLayout.findOne({ event: event._id });
    if (!layout) {
      layout = await SeatingLayout.create({
        event: event._id,
        zones: buildDefaultZonesFromEvent(event),
        history: [{
          version: 1,
          updatedBy: req.user._id,
          note: 'Auto-generated initial layout',
          changes: 'Initial layout created from event zones'
        }]
      });
    }

    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/seating/:eventId
// @desc    Replace seating layout with optimistic locking
// @access  Private
router.put('/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyLayout(req.user, event)) return res.status(403).json({ message: 'Not authorized' });

    const { zones, expectedVersion, note = 'Layout updated' } = req.body;
    if (!Array.isArray(zones)) return res.status(400).json({ message: 'zones array is required' });

    let layout = await SeatingLayout.findOne({ event: event._id });
    if (!layout) {
      layout = new SeatingLayout({
        event: event._id,
        version: 1,
        zones: [],
        history: []
      });
    } else if (expectedVersion && layout.version !== expectedVersion) {
      return res.status(409).json({
        message: 'Layout version conflict. Reload latest layout.',
        currentVersion: layout.version
      });
    }

    layout.version += 1;
    layout.zones = zones;
    layout.history.push({
      version: layout.version,
      updatedBy: req.user._id,
      note,
      changes: 'Full layout replacement'
    });
    await layout.save();

    req.emitRealtime?.(event._id.toString(), 'seating_update', {
      eventId: event._id,
      version: layout.version,
      zones: layout.zones
    });
    req.emitRealtime?.(event._id.toString(), 'seating_history_update', {
      eventId: event._id,
      version: layout.version,
      historyEntry: layout.history[layout.history.length - 1]
    });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/seating/:eventId/seat-status
// @desc    Update a single seat status with optimistic locking
// @access  Private
router.patch('/:eventId/seat-status', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyLayout(req.user, event)) return res.status(403).json({ message: 'Not authorized' });

    const { zoneId, seatId, status, expectedVersion } = req.body;
    if (!zoneId || !seatId || !status) {
      return res.status(400).json({ message: 'zoneId, seatId and status are required' });
    }

    const layout = await SeatingLayout.findOne({ event: event._id });
    if (!layout) return res.status(404).json({ message: 'Seating layout not found' });
    if (expectedVersion && layout.version !== expectedVersion) {
      return res.status(409).json({
        message: 'Layout version conflict. Reload latest layout.',
        currentVersion: layout.version
      });
    }

    const zone = layout.zones.find((z) => z.zoneId === zoneId);
    if (!zone) return res.status(404).json({ message: 'Zone not found in seating layout' });
    const seat = zone.seats.find((s) => s.seatId === seatId);
    if (!seat) return res.status(404).json({ message: 'Seat not found' });

    seat.status = status;
    seat.updatedAt = new Date();
    layout.version += 1;
    layout.history.push({
      version: layout.version,
      updatedBy: req.user._id,
      note: `Seat ${seatId} updated`,
      changes: `Seat status set to ${status}`
    });
    await layout.save();

    req.emitRealtime?.(event._id.toString(), 'seating_update', {
      eventId: event._id,
      version: layout.version,
      zoneId,
      seatId,
      status
    });

    res.json({
      message: 'Seat status updated',
      version: layout.version,
      seat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/seating/:eventId/history
// @desc    Get seating update history
// @access  Private
router.get('/:eventId/history', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!canModifyLayout(req.user, event)) return res.status(403).json({ message: 'Not authorized' });

    const layout = await SeatingLayout.findOne({ event: event._id }).select('event version history updatedAt');
    if (!layout) return res.status(404).json({ message: 'Seating layout not found' });

    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
