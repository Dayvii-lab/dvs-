const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Template = require('../models/Template');
const Application = require('../models/Application');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  const [users, creators, templates, orders, pendingApps] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'creator', status: 'active' }),
    Template.countDocuments({ active: true }),
    Order.countDocuments({ status: 'paid' }),
    Application.countDocuments({ status: 'pending' }),
  ]);
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$platformFee' } } },
  ]);
  res.json({
    customers: users,
    creators,
    templates,
    orders,
    pendingApplications: pendingApps,
    platformRevenue: revenueAgg[0]?.total || 0,
  });
});

// List creators
router.get('/creators', protect, adminOnly, async (req, res) => {
  const creators = await User.find({ role: 'creator' }).select('-password').sort({ createdAt: -1 });
  res.json(creators);
});

// Suspend / reactivate
router.post('/creators/:id/suspend', protect, adminOnly, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role !== 'creator') return res.status(404).json({ error: 'Not found' });
  u.status = u.status === 'suspended' ? 'active' : 'suspended';
  await u.save();
  res.json({ user: { id: u._id, status: u.status } });
});

// Templates moderation
router.get('/templates', protect, adminOnly, async (req, res) => {
  const templates = await Template.find()
    .populate('creator', 'name username')
    .sort({ createdAt: -1 });
  res.json(templates);
});

router.post('/templates/:id/toggle', protect, adminOnly, async (req, res) => {
  const t = await Template.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.active = !t.active;
  await t.save();
  res.json(t);
});

module.exports = router;
