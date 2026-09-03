const mongoose = require('mongoose');

const societyClubSchema = new mongoose.Schema({
  societyName: { type: String, required: true, trim: true },
  clubName: { type: String, required: true, trim: true, unique: true },
  coordinatorName: { type: String, required: true, trim: true },
  coordinatorEmail: { type: String, required: true, lowercase: true, trim: true },
  coordinatorPhone: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }, // soft-delete
}, { timestamps: true });

module.exports = mongoose.model('SocietyClub', societyClubSchema);
