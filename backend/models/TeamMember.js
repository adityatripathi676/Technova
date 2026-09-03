const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  role:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  department:  { type: String, trim: true, default: '' },
  bio:         { type: String, trim: true, default: '' },
  image:       { type: String, trim: true, default: '' }, // URL to profile photo
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl:   { type: String, trim: true, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
