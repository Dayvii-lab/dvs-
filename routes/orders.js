const express = require('express');
const Order = require('../models/Order');
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Current user's orders
router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('template', 'title previewImage price slug')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// Create order (status pending)
router.post('/', protect, async (req, res) => {
  try {
    const { templateId } = req.body;
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Already paid?
    const existing = await Order.findOne({
      user: req.user._id,
      template: template._id,
      status: 'paid',
    });
    if (existing) return res.json({ order: existing, alreadyPaid: true });

    const order = await Order.create({
      user: req.user._id,
      template: template._id,
      amount: template.price,
      status: 'pending',
    });

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('template', 'title previewImage price slug');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  res.json(order);
});

module.exports = router;
