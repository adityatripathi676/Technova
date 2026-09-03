const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TeamMember = require('../models/TeamMember');
const SocietyClub = require('../models/SocietyClub');
const FormField = require('../models/FormField');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// All routes: must be authenticated + admin role
router.use(protect, requireRole('admin'));

const VALID_FIELD_TYPES = ['text', 'textarea', 'checkbox', 'dropdown', 'multiselect', 'number', 'date'];

const sanitize = (str) => (typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : '');

// ─── USERS (Approver Accounts) ────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    // Explicitly exclude passwordHash — defence-in-depth on top of toJSON()
    const users = await User.find({ role: 'approver' })
      .select('-passwordHash -failedLoginAttempts -lockedUntil -__v');
    res.json(users);
  } catch (err) {
    console.error('[Admin/users GET]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password ||
        typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name:         sanitize(name).slice(0, 100),
      email:        email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook hashes it
      role:         'approver', // hardcoded — admin cannot set role via API
    });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'ADD_USER',
      details:    `Added approver: ${user.email}`,
    });

    res.status(201).json({
      message: 'User created',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[Admin/users POST]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    // Admin cannot deactivate themselves
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.email === req.user.email) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    target.isActive = false;
    await target.save();

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'REMOVE_USER',
      details:    `Deactivated: ${target.email}`,
    });

    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('[Admin/users deactivate]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// PATCH /admin/users/:id — edit approver name / email
router.patch('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: 'Provide at least name or email to update' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role !== 'approver') {
      return res.status(400).json({ message: 'Only approver accounts can be edited via this route' });
    }

    if (name) {
      if (typeof name !== 'string') return res.status(400).json({ message: 'Invalid name' });
      target.name = sanitize(name).slice(0, 100);
    }

    if (email) {
      const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      const normalised = email.toLowerCase().trim();
      // Duplicate check — exclude current record
      const exists = await User.findOne({ email: normalised, _id: { $ne: target._id } });
      if (exists) {
        return res.status(409).json({ message: 'This email is already in use by another account' });
      }
      target.email = normalised;
    }

    await target.save();

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'EDIT_USER',
      details:    `Edited approver: ${target.email} (name=${target.name})`,
    });

    res.json({ message: 'Approver updated', user: target });
  } catch (err) {
    console.error('[Admin/users PATCH]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});


// ─── TEAM MEMBERS ─────────────────────────────────────────────────────

router.get('/team', async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: -1 }).select('-__v');
    res.json(members);
  } catch (err) {
    console.error('[Admin/team GET]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/team', async (req, res) => {
  try {
    const { name, role, email, phone, department, bio, image, linkedinUrl, githubUrl } = req.body;

    if (!name || !role || !email || !phone ||
        typeof name !== 'string' || typeof role !== 'string' ||
        typeof email !== 'string' || typeof phone !== 'string') {
      return res.status(400).json({ message: 'Name, role, email, and phone are required' });
    }

    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const member = await TeamMember.create({
      name:        sanitize(name).slice(0, 100),
      role:        sanitize(role).slice(0, 100),
      email:       email.toLowerCase().trim(),
      phone:       sanitize(phone).slice(0, 20),
      department:  sanitize(department || '').slice(0, 100),
      bio:         sanitize(bio || '').slice(0, 500),
      image:       typeof image === 'string' ? image.trim() : '',
      linkedinUrl: typeof linkedinUrl === 'string' ? linkedinUrl.trim().slice(0, 300) : '',
      githubUrl:   typeof githubUrl === 'string' ? githubUrl.trim().slice(0, 300) : '',
    });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'ADD_MEMBER',
      details:    `Added: ${member.name} (${member.role})`,
    });

    res.status(201).json(member);
  } catch (err) {
    console.error('[Admin/team POST]', err);
    res.status(500).json({ message: err.message || 'An error occurred.' });
  }
});

router.patch('/team/:id', async (req, res) => {
  try {
    const { name, role, email, phone, department, bio, image, linkedinUrl, githubUrl } = req.body;

    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (name) member.name = sanitize(name).slice(0, 100);
    if (role) member.role = sanitize(role).slice(0, 100);
    
    if (email) {
      const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });
      member.email = email.toLowerCase().trim();
    }
    
    if (phone) {
      const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(phone)) return res.status(400).json({ message: 'Invalid phone number format' });
      member.phone = sanitize(phone).slice(0, 20);
    }

    if (department !== undefined) member.department = sanitize(department).slice(0, 100);
    if (bio !== undefined) member.bio = sanitize(bio).slice(0, 500);
    if (image !== undefined) member.image = typeof image === 'string' ? image.trim() : '';
    if (linkedinUrl !== undefined) member.linkedinUrl = typeof linkedinUrl === 'string' ? linkedinUrl.trim().slice(0, 300) : '';
    if (githubUrl !== undefined) member.githubUrl = typeof githubUrl === 'string' ? githubUrl.trim().slice(0, 300) : '';

    await member.save();

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'EDIT_MEMBER',
      details:    `Edited member: ${member.name}`,
    });

    res.json(member);
  } catch (err) {
    console.error('[Admin/team PATCH]', err);
    res.status(500).json({ message: err.message || 'An error occurred.' });
  }
});

router.delete('/team/:id', async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'REMOVE_MEMBER',
      details:    `Permanently removed: ${member.name}`,
    });

    res.json({ message: 'Team member permanently removed' });
  } catch (err) {
    console.error('[Admin/team DELETE]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// ─── CLUBS & SOCIETIES ────────────────────────────────────────────────

router.get('/clubs', async (req, res) => {
  try {
    const clubs = await SocietyClub.find().sort({ createdAt: -1 }).select('-__v');
    res.json(clubs);
  } catch (err) {
    console.error('[Admin/clubs GET]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/clubs', async (req, res) => {
  try {
    const { societyName, clubName, coordinatorName, coordinatorEmail, coordinatorPhone } = req.body;

    if (!societyName || !clubName || !coordinatorName || !coordinatorEmail || !coordinatorPhone ||
        [societyName, clubName, coordinatorName, coordinatorEmail, coordinatorPhone].some(v => typeof v !== 'string')) {
      return res.status(400).json({
        message: 'societyName, clubName, coordinatorName, coordinatorEmail, and coordinatorPhone are all required',
      });
    }

    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    if (!emailRegex.test(coordinatorEmail)) {
      return res.status(400).json({ message: 'Invalid coordinator email' });
    }

    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(coordinatorPhone)) {
      return res.status(400).json({ message: 'Invalid coordinator phone number' });
    }

    const exists = await SocietyClub.findOne({ clubName: clubName.trim() });
    if (exists) return res.status(400).json({ message: 'A club with this name already exists' });

    const club = await SocietyClub.create({
      societyName:       sanitize(societyName).slice(0, 100),
      clubName:          sanitize(clubName).slice(0, 100),
      coordinatorName:   sanitize(coordinatorName).slice(0, 100),
      coordinatorEmail:  coordinatorEmail.toLowerCase().trim(),
      coordinatorPhone:  sanitize(coordinatorPhone).slice(0, 20),
    });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'ADD_CLUB',
      details:    `Added club: ${club.clubName} (Coordinator: ${club.coordinatorName})`,
    });

    res.status(201).json(club);
  } catch (err) {
    console.error('[Admin/clubs POST]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.delete('/clubs/:id', async (req, res) => {
  try {
    const club = await SocietyClub.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!club) return res.status(404).json({ message: 'Club not found' });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'REMOVE_CLUB',
      details:    `Removed: ${club.clubName}`,
    });

    res.json({ message: 'Club removed' });
  } catch (err) {
    console.error('[Admin/clubs DELETE]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// ─── FORM FIELDS ──────────────────────────────────────────────────────

router.get('/fields', async (req, res) => {
  try {
    const fields = await FormField.find().sort({ order: 1 }).select('-__v');
    res.json(fields);
  } catch (err) {
    console.error('[Admin/fields GET]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.post('/fields', async (req, res) => {
  try {
    const { fieldKey, fieldLabel, fieldType, required, options } = req.body;

    if (!fieldKey || !fieldLabel || !fieldType ||
        typeof fieldKey !== 'string' || typeof fieldLabel !== 'string') {
      return res.status(400).json({ message: 'fieldKey, fieldLabel, and fieldType are required' });
    }

    // Whitelist fieldType
    if (!VALID_FIELD_TYPES.includes(fieldType)) {
      return res.status(400).json({ message: `Invalid fieldType. Must be one of: ${VALID_FIELD_TYPES.join(', ')}` });
    }

    // Sanitize key: alphanumeric + underscore only
    const safeKey = fieldKey.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
    if (!safeKey) return res.status(400).json({ message: 'Invalid fieldKey format' });

    // Never use req.body directly — whitelist fields explicitly
    const field = await FormField.create({
      fieldKey:   safeKey,
      fieldLabel: sanitize(fieldLabel).slice(0, 200),
      fieldType,
      required:   Boolean(required),
      options:    Array.isArray(options)
        ? options.filter(o => typeof o === 'string').map(o => sanitize(o).slice(0, 100)).slice(0, 50)
        : [],
      enabled: true,
    });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'ADD_FIELD',
      details:    `Added field: ${field.fieldLabel}`,
    });

    res.status(201).json(field);
  } catch (err) {
    console.error('[Admin/fields POST]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

router.patch('/fields/:id', async (req, res) => {
  try {
    // Only allow toggling enabled/disabled — nothing else via this endpoint
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled (boolean) is required' });
    }

    const field = await FormField.findByIdAndUpdate(
      req.params.id, { enabled }, { new: true }
    );
    if (!field) return res.status(404).json({ message: 'Field not found' });

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'TOGGLE_FIELD',
      details:    `${enabled ? 'Enabled' : 'Disabled'} field: ${field.fieldLabel}`,
    });

    res.json(field);
  } catch (err) {
    console.error('[Admin/fields PATCH]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// ─── DELETE FIELD ────────────────────────────────────────────────────────
router.delete('/fields/:id', async (req, res) => {
  try {
    const field = await FormField.findById(req.params.id);
    if (!field) return res.status(404).json({ message: 'Field not found' });

    await FormField.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole:  'admin',
      action:     'DELETE_FIELD',
      details:    `Deleted field: ${field.fieldLabel} (${field.fieldKey})`,
    });

    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('[Admin/fields DELETE]', err);
    res.status(500).json({ message: err.message || 'An error occurred.' });
  }
});

// ─── AUDIT LOGS ───────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res) => {
  try {
    const pageNum  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v');

    const total = await AuditLog.countDocuments();
    res.json({ logs, total });
  } catch (err) {
    console.error('[Admin/audit-logs]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

module.exports = router;
