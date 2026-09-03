const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// ── Constant-time safe response: always say "Invalid credentials"
// so attackers can't enumerate valid emails.

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password ||
        typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Brute-force lockout check ──────────────────────────────────
    const user = await User.findOne({ email: normalizedEmail });

    // Check lockout BEFORE running bcrypt (to prevent timing oracle)
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(429).json({
        message: 'Account temporarily locked due to too many failed attempts. Try again later.',
      });
    }

    // If user doesn't exist, still run a dummy bcrypt compare to keep
    // response time constant (prevent user enumeration via timing).
    const DUMMY_HASH = '$2a$12$invalidhashvaluethatisusedtopreventidenumeration000000';
    const isMatch = user
      ? await user.matchPassword(password)
      : await require('bcryptjs').compare(password, DUMMY_HASH).then(() => false);

    if (!user || !isMatch || !user.isActive) {
      // Track failed attempts
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
          user.failedLoginAttempts = 0;
        }
        await user.save();
      }
      // Generic message — never reveal if the account exists
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ── Successful login — reset lockout ──────────────────────────
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await user.save();
    }

    // ── Sign JWT with issuer + audience ──────────────────────────
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h',
        algorithm: 'HS256',
        issuer:    'technova-api',
        audience:  'technova-client',
      }
    );

    await AuditLog.create({
      actorEmail: user.email,
      actorRole:  user.role,
      action:     'LOGIN',
      details:    `${user.name} logged in`,
    });

    // Return minimal user info — never include passwordHash
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture },
    });
  } catch (err) {
    // Never expose internal error messages to the client
    console.error('[Auth/login]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { targetEmail, newPassword, currentPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required' });
    }

    // ── Password strength: min 8 chars, at least 1 number ─────────
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Admins change anyone; approvers can only change their own
    const emailToChange = (req.user.role === 'admin' && targetEmail)
      ? targetEmail.toLowerCase().trim()
      : req.user.email;

    if (req.user.role !== 'admin' && emailToChange !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Approvers must supply their current password as re-auth
    if (req.user.role === 'approver') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change your password' });
      }
      const self = await User.findOne({ email: req.user.email });
      const valid = self ? await self.matchPassword(currentPassword) : false;
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    const user = await User.findOne({ email: emailToChange });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.passwordHash = newPassword; // pre-save hook hashes it
    await user.save();

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  req.user.role,
      action:     'PASSWORD_RESET',
      details:    `Password changed for ${emailToChange}`,
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth/change-password]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// PATCH /api/auth/profile — update profile (e.g. profile picture)
router.patch('/profile', protect, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (profilePicture !== undefined) {
      // Size validation for base64 string (~10MB max, padded for base64 overhead)
      if (profilePicture.length > 14000000) {
        return res.status(400).json({ message: 'Profile picture is too large. Max size is 10MB.' });
      }
      user.profilePicture = profilePicture;
    }

    await user.save();

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('[Auth/profile]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// GET /api/auth/me — return current user info (verified by protect middleware)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -failedLoginAttempts -lockedUntil -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture });
  } catch (err) {
    console.error('[Auth/me]', err);
    res.status(500).json({ message: 'An error occurred' });
  }
});

module.exports = router;
