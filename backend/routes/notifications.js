const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Public route to save a user's subscription
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Validate subscription payload
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }
    
    // Upsert subscription based on endpoint
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    res.status(201).json({ message: 'Subscription saved successfully.' });
  } catch (err) {
    console.error('[Notifications] subscribe error:', err);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

// Admin/System internal route - Not typically called from frontend directly, but used internally or protected
// We'll expose a test endpoint just for manual trigger if needed, protected by admin auth
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.post('/broadcast', protect, requireRole('admin', 'approver'), async (req, res) => {
  try {
    const { title, body, url } = req.body;
    
    const payload = JSON.stringify({
      title: title || 'Technova Update',
      body: body || 'A new update is available.',
      url: url || '/'
    });
    
    const subscriptions = await PushSubscription.find({});
    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, remove it
          return PushSubscription.deleteOne({ _id: sub._id });
        }
        console.error('Failed to send notification to a subscriber:', err);
      })
    );
    
    await Promise.all(sendPromises);
    res.status(200).json({ message: `Broadcast sent to ${subscriptions.length} subscribers.` });
  } catch (err) {
    console.error('[Notifications] broadcast error:', err);
    res.status(500).json({ message: 'Failed to broadcast notification' });
  }
});

module.exports = router;
