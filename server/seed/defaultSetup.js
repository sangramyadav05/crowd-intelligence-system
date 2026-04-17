import { Event, User, VenuePlan } from '../models/index.js';

export const ensureDefaultSetup = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@crowdintelligence.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    try {
      adminUser = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      adminUser = await User.findOne({ email: adminEmail });
    }
  }

  let event = await Event.findOne({ eventId: 'EVT-DEMO1' });
  if (!event) {
    try {
      event = await Event.create({
        eventId: 'EVT-DEMO1',
        name: 'Default Demo Event',
        description: 'Seeded default event for platform startup',
        location: { address: 'Central Arena' },
        venue: { name: 'Central Arena', city: 'Demo City', address: 'Central Arena' },
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        expectedCrowdSize: 1500,
        expectedAttendance: 1500,
        organizer: adminUser._id,
        zones: [
          { name: 'Main Stage', capacity: 700, currentCount: 0 },
          { name: 'Food Court', capacity: 450, currentCount: 0 },
          { name: 'Entry Plaza', capacity: 350, currentCount: 0 }
        ]
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      event = await Event.findOne({ eventId: 'EVT-DEMO1' });
    }
  }

  const existingPlan = await VenuePlan.findOne({ eventId: event.eventId });
  if (!existingPlan) {
    await VenuePlan.create({
      eventId: event.eventId,
      updatedBy: adminUser._id,
      zones: [
        {
          zoneId: 'main-stage',
          name: 'Main Stage',
          polygon: [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 40 }, { x: 10, y: 40 }],
          maxCapacity: 700,
          congestionThreshold: 80,
          flowStatus: 'free',
          areaSqm: 2200,
          exitWidthMeters: 5,
          staffPoints: [{ x: 15, y: 15 }],
          emergencyExitOnly: false
        },
        {
          zoneId: 'food-court',
          name: 'Food Court',
          polygon: [{ x: 10, y: 50 }, { x: 55, y: 50 }, { x: 55, y: 90 }, { x: 10, y: 90 }],
          maxCapacity: 450,
          congestionThreshold: 75,
          flowStatus: 'free',
          areaSqm: 1400,
          exitWidthMeters: 3.5,
          staffPoints: [{ x: 14, y: 70 }],
          emergencyExitOnly: false
        }
      ],
      flowArrows: [
        {
          from: { x: 15, y: 45 },
          to: { x: 70, y: 45 },
          message: 'Use this corridor for smoother movement'
        }
      ]
    });
  }
};
