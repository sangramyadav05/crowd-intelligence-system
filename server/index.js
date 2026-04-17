import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import crowdRoutes from './routes/crowd.routes.js';
import adminRoutes from './routes/admin.routes.js';
import staffRoutes from './routes/staff.routes.js';
import publicRoutes from './routes/public.routes.js';
import aiRoutes from './routes/ai.routes.js';
import seatingRoutes from './routes/seating.routes.js';
import venueRoutes from './routes/venue.routes.js';
import venuePlanRoutes from './routes/venue-plan.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import surveillanceRoutes from './routes/surveillance.routes.js';
import getZonesRoutes from './routes/get_zones.routes.js';
import { VenuePlan } from './models/index.js';
import { ensureDefaultSetup } from './seed/defaultSetup.js';
import { isPortAvailable } from './utils/portCheck.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const allowedOrigins = new Set([process.env.CLIENT_URL || 'http://localhost:5173']);
for (let port = 5173; port <= 5185; port += 1) {
  allowedOrigins.add(`http://localhost:${port}`);
  allowedOrigins.add(`http://127.0.0.1:${port}`);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server tools and local scripts without an Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});
const adminNamespace = io.of('/admin');
const publicNamespace = io.of('/public');
const staffNamespace = io.of('/staff');

// Connect to MongoDB and seed defaults when available.
const connectedToDb = await connectDB();
if (connectedToDb) {
  await ensureDefaultSetup();
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '12mb' }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  req.emitRealtime = (eventId, eventName, payload) => {
    const room = `event-${eventId}`;
    io.to(room).emit(eventName, payload);
    adminNamespace.to(room).emit(eventName, payload);
    publicNamespace.to(room).emit(eventName, payload);
    staffNamespace.to(room).emit(eventName, payload);
  };
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/venue', venueRoutes);
app.use('/api/venue-plan', venuePlanRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/surveillance', surveillanceRoutes);
app.use('/api/get_zones', getZonesRoutes);

const geoState = {
  participantsByEvent: new Map(),
  metricsByEvent: new Map()
};

const pointInPolygon = (point, polygon = []) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const registerNamespace = (namespace) => {
  namespace.on('connection', (socket) => {
    socket.on('join_event_room', (eventId) => {
      socket.join(`event-${eventId}`);
    });
    // Backward-compatible event alias.
    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
    });

    socket.on('gps_update', async (payload) => {
      try {
        const eventId = String(payload.eventId || '').toUpperCase();
        if (!eventId || typeof payload.x !== 'number' || typeof payload.y !== 'number') return;

        const plan = await VenuePlan.findOne({ eventId });
        if (!plan) return;

        const point = { x: payload.x, y: payload.y };
        const currentZone = plan.zones.find((zone) => pointInPolygon(point, zone.polygon));
        const now = Date.now();

        const eventParticipants = geoState.participantsByEvent.get(eventId) || new Map();
        eventParticipants.set(socket.id, {
          point,
          zoneId: currentZone?.zoneId || 'outside',
          timestamp: now
        });

        // Remove stale participants.
        for (const [socketId, data] of eventParticipants.entries()) {
          if (now - data.timestamp > 120000) eventParticipants.delete(socketId);
        }
        geoState.participantsByEvent.set(eventId, eventParticipants);

        const previousMetrics = geoState.metricsByEvent.get(eventId) || { zoneCounts: {}, timestamp: now };
        const elapsedMinutes = Math.max((now - previousMetrics.timestamp) / 60000, 0.25);

        const zoneIntelligence = plan.zones.map((zone) => {
          const people = [...eventParticipants.values()].filter((item) => item.zoneId === zone.zoneId).length;
          const previousCount = previousMetrics.zoneCounts?.[zone.zoneId] || 0;
          const rateOfChange = (people - previousCount) / elapsedMinutes;
          const congestionPercent = Math.round((people / zone.maxCapacity) * 100);
          const timeToClearMinutes = Math.max(
            1,
            Math.round(people / Math.max(zone.exitWidthMeters * 12, 1))
          );
          return {
            zoneId: zone.zoneId,
            people,
            maxCapacity: zone.maxCapacity,
            congestionPercent,
            trendPerMinute: Number(rateOfChange.toFixed(2)),
            timeToClearMinutes,
            flowStatus: congestionPercent >= zone.congestionThreshold ? 'congested' : congestionPercent > 60 ? 'moderate' : 'free',
            emergencyExitOnly: zone.emergencyExitOnly
          };
        });

        const zoneCounts = {};
        zoneIntelligence.forEach((item) => { zoneCounts[item.zoneId] = item.people; });
        geoState.metricsByEvent.set(eventId, { zoneCounts, timestamp: now });

        const room = `event-${eventId}`;
        adminNamespace.to(room).emit('zone_intelligence_update', { eventId, zones: zoneIntelligence, position: point, currentZone: currentZone?.zoneId || null });
        publicNamespace.to(room).emit('zone_intelligence_update', { eventId, zones: zoneIntelligence, position: point, currentZone: currentZone?.zoneId || null });
        adminNamespace.to(room).emit('density_update', { eventId, zones: zoneIntelligence, timestamp: new Date() });
        publicNamespace.to(room).emit('density_update', { eventId, zones: zoneIntelligence, timestamp: new Date() });

        if (currentZone?.emergencyExitOnly) {
          const alertPayload = {
            type: 'high_priority',
            eventId,
            message: `Emergency exit only zone entered: ${currentZone.name}`,
            severity: 'critical'
          };
          adminNamespace.to(room).emit('notifications', alertPayload);
          publicNamespace.to(room).emit('notifications', alertPayload);
        }
      } catch (error) {
        console.error('gps_update handling error:', error.message);
      }
    });
  });
};

registerNamespace(io);
registerNamespace(adminNamespace);
registerNamespace(publicNamespace);
registerNamespace(staffNamespace);

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);
const serverInstance = httpServer;

serverInstance.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the conflicting process or set a different PORT.`);
    process.exit(1);
  }
  console.error('Server startup failed:', error.message);
  process.exit(1);
});

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  io.close(() => {
    serverInstance.close(async () => {
      await mongoose.connection.close();
      console.log('HTTP server and MongoDB connection closed');
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const startServer = async () => {
  const available = await isPortAvailable(PORT);
  if (!available) {
    console.error(`Port ${PORT} is already in use. Stop the conflicting process or set a different PORT.`);
    process.exit(1);
  }
  serverInstance.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

export { io };
