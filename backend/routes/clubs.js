const express = require('express');
const router = express.Router();
const SocietyClub = require('../models/SocietyClub');

// GET /api/clubs — public, for submission form dropdown
// Only returns fields needed for the form: societyName + clubName
// Coordinator contact details are intentionally excluded (internal info)
router.get('/', async (req, res) => {
  try {
    const clubs = await SocietyClub.find({ isActive: true })
      .select('societyName clubName coordinatorName') // coordinatorEmail/Phone excluded from public
      .sort({ clubName: 1 });
    res.json(clubs);
  } catch (err) {
    console.error('[Clubs/public]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

module.exports = router;
