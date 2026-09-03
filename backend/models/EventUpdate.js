const mongoose = require('mongoose');

const eventUpdateSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRequest', default: null },
  visibleToEventId: { type: String, default: null }, // 4-digit ID for coordinator tracker
  updateType: {
    type: String,
    enum: ['Event Reminder', 'Meeting Notice', 'Venue Change', 'Time Change', 'Cancellation', 'General Announcement'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  targetDate: { type: Date, required: true }, // date this update is about (typically next day)
  postedBy: { type: String, required: true }, // approver email
  postedByName: { type: String, required: true }, // approver display name
}, { timestamps: true });

module.exports = mongoose.model('EventUpdate', eventUpdateSchema);
