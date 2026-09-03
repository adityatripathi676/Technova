const mongoose = require('mongoose');

const resourceItemSchema = new mongoose.Schema({
  checked: { type: Boolean, default: false },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  feedback: { type: String, default: '' },
  count: { type: Number, default: 0 }, // used by canopy & chairs
}, { _id: false });

const assignedContactSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
  name: String,
  role: String,
  email: String,
  phone: String,
}, { _id: false });

// Auto-increment counter for 4-digit event ID
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 1000 },
});
const Counter = mongoose.model('Counter', counterSchema);

const eventRequestSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, index: true },

  // Submitter Info
  empId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  department: { type: String, required: true, trim: true },

  // Club Info
  clubName: { type: String, required: true },
  clubCoordinator: { type: String, required: true },

  // Event Details
  eventName: { type: String, required: true, trim: true },
  eventDescription: { type: String, required: true },
  eventDuration: { type: String, required: true },
  eventDate: { type: Date }, // for calendar plotting
  venue: { type: String, required: true, trim: true },

  // Resource Requirements — 9 independent items
  resources: {
    itPerson: { type: resourceItemSchema, default: {} },
    discipline: { type: resourceItemSchema, default: {} },
    operations: { type: resourceItemSchema, default: {} },
    bannerPrintings: { type: resourceItemSchema, default: {} },
    food: { type: resourceItemSchema, default: {} },
    canopy: { type: resourceItemSchema, default: {} },
    chairs: { type: resourceItemSchema, default: {} },
    electrician: { type: resourceItemSchema, default: {} },
    additionalMediaCoverage: { type: resourceItemSchema, default: {} },
  },

  // Additional Fields
  additionalRequirement: { type: String, default: '' }, // free-text textarea
  selectedSocieties: [{ type: String }],               // multiselect dropdown

  // Review State
  overallStatus: {
    type: String,
    enum: ['Pending', 'In Review', 'Partially Approved', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: { type: String, default: '' },
  overallFeedback: { type: String, default: '' },
  assignedContact: { type: assignedContactSchema, default: null },

  // Next-Day Updates linked to this event
  updates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventUpdate' }],
}, { timestamps: true });

// Pre-save: generate 4-digit zero-padded eventId atomically
eventRequestSchema.pre('save', async function (next) {
  if (this.eventId) return next();
  try {
    const counter = await Counter.findByIdAndUpdate(
      'eventId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.eventId = String(counter.seq).padStart(4, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('EventRequest', eventRequestSchema);
