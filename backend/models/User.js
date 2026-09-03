const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 100 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin', 'approver'], required: true },
  isActive:     { type: Boolean, default: true },

  // ── Profile ─────────────────────────────────────────────────────
  profilePicture: { type: String, default: '' }, // base64 data URL

  // ── Brute-force / lockout tracking ──────────────────────────────
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil:         { type: Date, default: null },
}, { timestamps: true });

// ── Never expose the hash or lockout fields via JSON ────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  return obj; // profilePicture is intentionally kept
};

// ── Password comparison with lockout guard ───────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// ── Hash password before every save (only when the field is modified) ─
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12); // increased from 10 → 12
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
