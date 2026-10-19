const express = require('express');
const jwt = require('jsonwebtoken');
const Template = require('../models/Template');
const Order = require('../models/Order');

const router = express.Router();

// Public catalog — only active templates from active creators
router.get('/', async (req, res) => {
  const { q, category, sort } = req.query;
  const filter = { active: true };
  if (q) filter.$text = { $search: q };
  if (category && category !== 'All') filter.category = category;

  let sortBy = { createdAt: -1 };
  if (sort === 'price_asc') sortBy = { price: 1 };
  if (sort === 'price_desc') sortBy = { price: -1 };
  if (sort === 'popular') sortBy = { sales: -1 };

  const templates = await Template.find(filter)
    .populate('creator', 'name username')
    .sort(sortBy)
    .limit(100);
  res.json(templates);
});

router.get('/:id', async (req, res) => {
  const template = await Template.findById(req.params.id).populate('creator', 'name username bio');
  if (!template) return res.status(404).json({ error: 'Template not found' });

  let purchased = false;
  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const order = await Order.findOne({
        user: decoded.id, template: template._id, status: 'paid',
      });
      purchased = !!order;
    } catch {}
  }
  res.json({ template, purchased });
});

module.exports = router;
