const express = require('express');
const Order = require('../models/Order');
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');

const router = express.Router();

const PLATFORM_FEE_PCT = 0.15;

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('template', 'title previewImage price slug')
    .populate('creator', 'name username')
    .sort({ createdAt: -1 });
  res.json(orders);
});

router.post('/', protect, async (req, res) => {
  try {
    const { templateId } = req.body;
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const existing = await Order.findOne({
      user: req.user._id, template: template._id, status: 'paid',
    });
    if (existing) return res.json({ order: existing, alreadyPaid: true });

    // Reuse a pending order for the same template
    let order = await Order.findOne({
      user: req.user._id, template: template._id, status: 'pending',
    });

    if (!order) {
      const platformFee = Math.round(template.price * PLATFORM_FEE_PCT);
      order = await Order.create({
        user: req.user._id,
        template: template._id,
        creator: template.creator,
        amount: template.price,
        creatorEarnings: template.price - platformFee,
        platformFee,
        status: 'pending',
      });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('template', 'title previewImage price slug')
    .populate('creator', 'name username');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  res.json(order);
});

module.exports = router;
