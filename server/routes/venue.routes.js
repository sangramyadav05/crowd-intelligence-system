import express from 'express';
import geofenceService from '../services/geofence.service.js';

const router = express.Router();

// @route   GET /api/venue/layout
// @desc    Get venue layout configuration
// @access  Public
router.get('/layout', async (_req, res) => {
  try {
    const layout = geofenceService.getVenueLayout();
    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/venue/geofence/check
// @desc    Check if a point is inside configured zone boundaries
// @access  Public
router.post('/geofence/check', async (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ message: 'x and y numeric coordinates are required' });
    }

    const zones = geofenceService.findContainingZones({ x, y });
    res.json({
      insideVenueZone: zones.length > 0,
      zones
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/venue/nearest-route
// @desc    Get nearest entry and exit for coordinates
// @access  Public
router.post('/nearest-route', async (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ message: 'x and y numeric coordinates are required' });
    }

    const result = geofenceService.getNearestEntryExit({ x, y });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
