const express = require('express');
const Template = require('../models/Template');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public list
router.get('/', async (req, res) => {
  const { q, category, sort } = req.query;
  const filter = { active: true };
  if (q) filter.$text = { $search: q };
  if (category && category !== 'All') filter.category = category;

  let sortBy = { createdAt: -1 };
  if (sort === 'price_asc') sortBy = { price: 1 };
  if (sort === 'price_desc') sortBy = { price: -1 };
  if (sort === 'popular') sortBy = { sales: -1 };

  const templates = await Template.find(filter).sort(sortBy).limit(100);
  res.json(templates);
});

// Single
router.get('/:id', async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  let purchased = false;
  if (req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const order = await Order.findOne({
        user: decoded.id,
        template: template._id,
        status: 'paid',
      });
      purchased = !!order;
    } catch {}
  }

  res.json({ template, purchased });
});

// Admin: create
router.post('/', protect, adminOnly, upload, async (req, res) => {
  try {
    const { title, description, category, price, tags, featured } = req.body;
    if (!req.files?.preview || !req.files?.file)
      return res.status(400).json({ error: 'Preview image and ZIP file required' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const template = await Template.create({
      title,
      slug,
      description,
      category,
      price: Number(price),
      previewImage: `/previews/${req.files.preview[0].filename}`,
      filePath: `uploads/files/${req.files.file[0].filename}`,
      fileSize: req.files.file[0].size,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      featured: featured === 'true',
    });

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update
router.put('/:id', protect, adminOnly, async (req, res) => {
  const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(template);
});

// Admin: delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
