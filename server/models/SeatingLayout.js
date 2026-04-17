import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  row: { type: Number, required: true, min: 1 },
  number: { type: Number, required: true, min: 1 },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'occupied', 'blocked', 'redirect'],
    default: 'available'
  },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const seatingZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  name: { type: String, required: true },
  rows: { type: Number, required: true, min: 1 },
  seatsPerRow: { type: Number, required: true, min: 1 },
  seats: [seatSchema]
}, { _id: false });

const seatingHistorySchema = new mongoose.Schema({
  version: { type: Number, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '' },
  changes: { type: String, default: 'Layout update' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const seatingLayoutSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  version: { type: Number, default: 1 },
  zones: [seatingZoneSchema],
  history: [seatingHistorySchema],
  updatedAt: { type: Date, default: Date.now }
});

seatingLayoutSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SeatingLayout = mongoose.model('SeatingLayout', seatingLayoutSchema);
export default SeatingLayout;
