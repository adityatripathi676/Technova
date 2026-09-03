const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');

// GET /api/team — public, read-only
// Only exposes safe public fields. Email and phone are NEVER sent to the public.
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find({ isActive: true })
      .select('name role department bio image linkedinUrl githubUrl')
      .sort({ createdAt: 1 });
    res.json(members);
  } catch (err) {
    console.error('[Team/public]', err);
    res.status(500).json({ message: 'An error occurred.' });
  }
});

module.exports = router;
