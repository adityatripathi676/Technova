const express = require('express');
const router = express.Router();
const EventRequest = require('../models/EventRequest');
const SocietyClub = require('../models/SocietyClub');

// ── Whitelist of allowed resource keys so the DB is never written with
//    arbitrary keys from the request body
const VALID_RESOURCES = [
  'itPerson', 'discipline', 'operations', 'bannerPrintings',
  'food', 'canopy', 'chairs', 'electrician', 'additionalMediaCoverage',
];

// POST /api/events/submit — public (no auth required by design)
router.post('/submit', async (req, res) => {
  try {
    const {
      empId, name, email, department, clubName,
      eventName, eventDescription, eventDuration, eventDate, venue,
      resources, additionalRequirement, selectedSocieties,
    } = req.body;

    // ── Required field validation ──────────────────────────────────
    if (!empId || !name || !email || !department || !clubName || !eventName || !eventDescription || !eventDuration || !venue) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // ── Email format sanity check ──────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // ── Verify club exists (using exact match — coordinatorName comes from DB, not user) ──
    const club = await SocietyClub.findOne({ clubName, isActive: true });
    if (!club) return res.status(400).json({ message: 'Club not found or inactive' });

    // ── Sanitize and whitelist resource keys ──────────────────────
    const safeResources = {};
    if (resources && typeof resources === 'object') {
      for (const key of VALID_RESOURCES) {
        if (resources[key]) {
          safeResources[key] = {
            checked: Boolean(resources[key].checked),
            // count must be a positive integer
            count:   Number.isInteger(Number(resources[key].count)) && Number(resources[key].count) > 0
                      ? Number(resources[key].count) : 0,
          };
        }
      }
    }

    // ── Conditional count validation ──────────────────────────────
    if (safeResources.canopy?.checked && safeResources.canopy.count < 1) {
      return res.status(400).json({ message: 'Canopy count must be a positive number' });
    }
    if (safeResources.chairs?.checked && safeResources.chairs.count < 1) {
      return res.status(400).json({ message: 'Number of chairs must be a positive number' });
    }

    // ── Sanitize free-text fields (strip HTML tags via simple replace) ─
    const sanitize = (str) => typeof str === 'string' ? str.replace(/<[^>]*>/g, '') : '';

    const event = await EventRequest.create({
      empId:    sanitize(empId).slice(0, 50),
      name:     sanitize(name).slice(0, 100),
      email:    email.toLowerCase().trim(),
      department: sanitize(department).slice(0, 100),
      clubName,
      clubCoordinator: club.coordinatorName, // always from DB, never from request body
      eventName:        sanitize(eventName).slice(0, 200),
      eventDescription: sanitize(eventDescription).slice(0, 2000),
      eventDuration:    sanitize(eventDuration).slice(0, 100),
      eventDate:        eventDate ? new Date(eventDate) : null,
      venue:            sanitize(venue).slice(0, 200),
      resources:        safeResources,
      additionalRequirement: sanitize(additionalRequirement).slice(0, 1000),
      selectedSocieties: Array.isArray(selectedSocieties)
        ? selectedSocieties.filter(s => typeof s === 'string').slice(0, 20)
        : [],
    });

    res.status(201).json({ message: 'Event submitted successfully', eventId: event.eventId });
  } catch (err) {
    console.error('[Events/submit]', err);
    res.status(500).json({ message: 'Submission failed. Please try again.' });
  }
});

// GET /api/events/track/:eventId — public, track by 4-digit ID
router.get('/track/:eventId', async (req, res) => {
  try {
    // Validate format — must be a 4-digit numeric string
    if (!/^\d{4}$/.test(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await EventRequest.findOne({ eventId: req.params.eventId })
      .populate('updates')
      // ── Never expose internal reviewer email or full audit trail to public ──
      .select('-reviewedBy -__v');

    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.json(event);
  } catch (err) {
    console.error('[Events/track]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// GET /api/events/track-by-email?email= — public
router.get('/track-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic format check to prevent ReDoS
    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const events = await EventRequest.find({ email: email.toLowerCase().trim() })
      .select('eventId eventName clubName overallStatus createdAt eventDate')
      .sort({ createdAt: -1 })
      .limit(100); // cap at 100 results to prevent data dump

    res.json(events);
  } catch (err) {
    console.error('[Events/track-by-email]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// GET /api/events/approved — public
router.get('/approved', async (req, res) => {
  try {
    const events = await EventRequest.find({ overallStatus: 'Approved' })
      .select('-__v -updates -resources')
      .sort({ eventDate: 1 })
      .limit(100);
    res.json({ events });
  } catch (err) {
    console.error('[Events/approved]', err);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

module.exports = router;
