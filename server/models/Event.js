import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  currentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  alerts: [{
    type: { type: String, enum: ['warning', 'critical'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: String,
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  expectedCrowdSize: {
    type: Number,
    required: true,
    min: 1
  },
  expectedAttendance: {
    type: Number,
    min: 1
  },
  venue: {
    name: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' }
  },
  accessCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  zones: [zoneSchema],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  aiEnabled: {
    type: Boolean,
    default: true
  },
  alertsEnabled: {
    type: Boolean,
    default: true
  },
  emergencyState: {
    isActive: { type: Boolean, default: false },
    level: { type: String, enum: ['none', 'warning', 'critical'], default: 'none' },
    activePlan: { type: String, trim: true, default: '' },
    activatedAt: { type: Date },
    activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  commandLog: [{
    type: { type: String, enum: ['broadcast', 'zone-directive'], required: true },
    message: { type: String, required: true, trim: true },
    zoneId: { type: String, default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  passcodes: {
    crowd: { type: String, default: '' },
    observer: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate access code before validation so required check passes.
eventSchema.pre('validate', async function(next) {
  // New documents may report accessCode as unmodified; generate when missing.
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  if (!this.accessCode) this.accessCode = generateCode();
  if (!this.eventId) this.eventId = `EVT-${generateCode()}`;
  if (!this.passcodes?.crowd) this.passcodes.crowd = generateCode();
  if (!this.passcodes?.observer) this.passcodes.observer = generateCode();
  if (!this.expectedAttendance) this.expectedAttendance = this.expectedCrowdSize;
  next();
});

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total crowd across all zones
eventSchema.methods.getTotalCrowd = function() {
  return this.zones.reduce((total, zone) => total + zone.currentCount, 0);
};

// Get crowd status
eventSchema.methods.getStatus = function() {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now > this.endTime) return 'completed';
  return 'active';
};

const Event = mongoose.model('Event', eventSchema);
export default Event;
