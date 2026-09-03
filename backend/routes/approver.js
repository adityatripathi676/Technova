const express = require('express');
const router = express.Router();
const EventRequest = require('../models/EventRequest');
const TeamMember = require('../models/TeamMember');
const AuditLog = require('../models/AuditLog');
const EventUpdate = require('../models/EventUpdate');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// All approver routes require authenticated + (admin OR approver) role
router.use(protect, requireRole('admin', 'approver'));

const VALID_RESOURCES = [
  'itPerson', 'discipline', 'operations', 'bannerPrintings',
  'food', 'canopy', 'chairs', 'electrician', 'additionalMediaCoverage',
];

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected'];

const VALID_UPDATE_TYPES = [
  'Event Reminder', 'Meeting Notice', 'Venue Change',
  'Time Change', 'Cancellation', 'General Announcement',
];

// GET /api/approver/queue
router.get('/queue', async (req, res) => {
  try {
    const VALID_QUEUE_STATUSES = ['Pending', 'In Review', 'Partially Approved', 'Approved', 'Rejected'];
    const { status = 'Pending', page = 1, limit = 20 } = req.query;

    // Whitelist status values to prevent query injection
    if (!VALID_QUEUE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const events = await EventRequest.find({ overallStatus: status })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-updates -__v'); // don't send full update list in queue view

    const total = await EventRequest.countDocuments({ overallStatus: status });
    res.json({ events, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('[Approver/queue]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// GET /api/approver/calendar
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};

    if (month !== undefined && year !== undefined) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (isNaN(m) || isNaN(y) || m < 1 || m > 12 || y < 2000 || y > 2100) {
        return res.status(400).json({ message: 'Invalid month or year' });
      }
      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 0, 23, 59, 59);
      query.eventDate = { $gte: start, $lte: end };
    }

    const events = await EventRequest.find(query)
      .select('eventId eventName clubName overallStatus eventDate venue')
      .limit(500); // cap to prevent data dump

    res.json(events);
  } catch (err) {
    console.error('[Approver/calendar]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// GET /api/approver/event/:eventId
router.get('/event/:eventId', async (req, res) => {
  try {
    if (!/^\d{4}$/.test(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    const event = await EventRequest.findOne({ eventId: req.params.eventId })
      .populate('updates')
      .select('-__v');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('[Approver/event]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// PATCH /api/approver/review/:eventId
router.patch('/review/:eventId', async (req, res) => {
  try {
    if (!/^\d{4}$/.test(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const { resources, overallFeedback, overallStatus } = req.body;
    const event = await EventRequest.findOne({ eventId: req.params.eventId });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const previousStatus = event.overallStatus;

    // ── Whitelist resource keys and status values ──────────────────
    if (resources && typeof resources === 'object') {
      for (const key of VALID_RESOURCES) {
        if (!resources[key]) continue;

        const incoming = resources[key];

        // Status must be from whitelist
        if (incoming.status !== undefined) {
          if (!VALID_STATUSES.includes(incoming.status)) {
            return res.status(400).json({ message: `Invalid status value for ${key}` });
          }
          event.resources[key].status = incoming.status;
        }

        // Feedback: strip HTML, cap length
        if (incoming.feedback !== undefined) {
          event.resources[key].feedback = String(incoming.feedback)
            .replace(/<[^>]*>/g, '').slice(0, 500);
        }
      }
    }

    // ── Set overall status explicitly if provided ─────────────────
    const VALID_OVERALL_STATUSES = ['Pending', 'In Review', 'Partially Approved', 'Approved', 'Rejected'];
    if (overallStatus && VALID_OVERALL_STATUSES.includes(overallStatus)) {
      event.overallStatus = overallStatus;
    }

    if (overallFeedback !== undefined) {
      event.overallFeedback = String(overallFeedback).replace(/<[^>]*>/g, '').slice(0, 1000);
    }
    event.reviewedBy = req.user.email;

    await event.save();
    await event.populate('updates');

    // Log a single consolidated entry for the event modification instead of minor line-item changes
    const hasResourceChanges = resources && typeof resources === 'object' && Object.keys(resources).some(key => VALID_RESOURCES.includes(key) && resources[key]?.status);
    
    if (hasResourceChanges || overallStatus) {
      await AuditLog.create({
        actorEmail:    req.user.email,
        actorRole:     req.user.role,
        action:        'EVENT_MODIFIED',
        targetEventId: req.params.eventId,
        details:       `Reviewed resources/status for event: ${event.eventName}`
      });
    }

    // ── Web Push Notification on Approval ───────────────────────
    if (previousStatus !== 'Approved' && event.overallStatus === 'Approved') {
      try {
        const subscriptions = await PushSubscription.find({});
        const payload = JSON.stringify({
          title: 'Event Approved!',
          body: `${event.eventName} by ${event.clubName} has been approved.`,
          url: '/events'
        });
        const sendPromises = subscriptions.map(sub => 
          webpush.sendNotification(sub, payload).catch(err => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              return PushSubscription.deleteOne({ _id: sub._id });
            }
          })
        );
        await Promise.all(sendPromises);
      } catch (pushErr) {
        console.error('Failed to send push notifications:', pushErr);
      }
    }

    res.json({ message: 'Review submitted', overallStatus: event.overallStatus, event });
  } catch (err) {
    console.error('[Approver/review]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// POST /api/approver/assign-contact/:eventId
router.post('/assign-contact/:eventId', async (req, res) => {
  try {
    if (!/^\d{4}$/.test(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const { memberId } = req.body;
    if (!memberId || typeof memberId !== 'string') {
      return res.status(400).json({ message: 'memberId is required' });
    }

    const event = await EventRequest.findOne({ eventId: req.params.eventId });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Verify member exists in our DB — never trust client-supplied contact data
    const member = await TeamMember.findById(memberId).select('name role email phone isActive');
    if (!member || !member.isActive) {
      return res.status(404).json({ message: 'Team member not found or inactive' });
    }

    // Always populate from DB, never from request body
    event.assignedContact = {
      memberId: member._id,
      name:     member.name,
      role:     member.role,
      email:    member.email,
      phone:    member.phone,
    };
    await event.save();

    await AuditLog.create({
      actorEmail:    req.user.email,
      actorRole:     req.user.role,
      action:        'ASSIGN_CONTACT',
      targetEventId: req.params.eventId,
      details:       `Assigned ${member.name} (${member.role})`,
    });

    res.json({ message: 'Contact assigned', contact: event.assignedContact });
  } catch (err) {
    console.error('[Approver/assign-contact]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// POST /api/approver/updates
router.post('/updates', async (req, res) => {
  try {
    const { eventId, updateType, title, message, targetDate } = req.body;

    // ── Required field check ──────────────────────────────────────
    if (!updateType || !title || !message || !targetDate) {
      return res.status(400).json({ message: 'updateType, title, message, and targetDate are required' });
    }

    // ── Whitelist updateType ──────────────────────────────────────
    if (!VALID_UPDATE_TYPES.includes(updateType)) {
      return res.status(400).json({ message: 'Invalid updateType' });
    }

    // ── Validate targetDate ───────────────────────────────────────
    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid targetDate' });
    }

    // ── Validate optional eventId format ─────────────────────────
    if (eventId && !/^\d{4}$/.test(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    let eventRef = null;
    let event = null;

    if (eventId) {
      event = await EventRequest.findOne({ eventId });
      if (!event) return res.status(404).json({ message: 'Event not found' });
      eventRef = event._id;
    }

    // Sanitize free-text
    const sanitize = (str) => String(str).replace(/<[^>]*>/g, '');

    const update = await EventUpdate.create({
      eventId:         eventRef,
      visibleToEventId: eventId || null,
      updateType,
      title:       sanitize(title).slice(0, 200),
      message:     sanitize(message).slice(0, 2000),
      targetDate:  parsedDate,
      postedBy:    req.user.email,
      postedByName: req.user.name,
    });

    if (event) {
      event.updates.push(update._id);
      await event.save();
    }

    await AuditLog.create({
      actorEmail:    req.user.email,
      actorRole:     req.user.role,
      action:        'POST_UPDATE',
      targetEventId: eventId || null,
      details:       `Posted "${updateType}": ${sanitize(title).slice(0, 100)}`,
    });

    res.status(201).json({ message: 'Update posted', update });
  } catch (err) {
    console.error('[Approver/updates]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// GET /api/approver/updates
router.get('/updates', async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};

    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid date parameter' });
      }
      // Create new Date objects to avoid the mutable-setHours bug
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      query.targetDate = { $gte: start, $lte: end };
    }

    const updates = await EventUpdate.find(query)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(updates);
  } catch (err) {
    console.error('[Approver/updates GET]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

// GET /api/approver/team-members
router.get('/team-members', async (req, res) => {
  try {
    const members = await TeamMember.find({ isActive: true })
      .select('name role email phone')
      .limit(200);
    res.json(members);
  } catch (err) {
    console.error('[Approver/team-members]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

module.exports = router;
