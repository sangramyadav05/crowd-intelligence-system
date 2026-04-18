import mongoose from 'mongoose';

const eventMessageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  zoneId: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['question', 'answer'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: String,
    trim: true,
    default: ''
  },
  fromRole: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const EventMessage = mongoose.model('EventMessage', eventMessageSchema);
export default EventMessage;
