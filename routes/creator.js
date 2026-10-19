const express = require('express');
const Template = require('../models/Template');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const { protect, creatorOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// My templates
router.get('/templates', protect, creatorOnly, async (req, res) => {
  const templates = await Template.find({ creator: req.user._id }).sort({ createdAt: -1 });
  res.json(templates);
});

// Upload new template
router.post('/templates', protect, creatorOnly, upload.templateUpload, async (req, res) => {
  try {
    const { title, description, category, price, tags } = req.body;
    if (!req.files?.preview || !req.files?.file)
      return res.status(400).json({ error: 'Preview and ZIP required' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const template = await Template.create({
      creator: req.user._id,
      title, slug, description, category,
      price: Number(price),
      previewImage: `/previews/${req.files.preview[0].filename}`,
      filePath: `uploads/files/${req.files.file[0].filename}`,
      fileSize: req.files.file[0].size,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete my template
router.delete('/templates/:id', protect, creatorOnly, async (req, res) => {
  const t = await Template.findOne({ _id: req.params.id, creator: req.user._id });
  if (!t) return res.status(404).json({ error: 'Not found' });
  await Template.deleteOne({ _id: t._id });
  res.json({ message: 'Deleted' });
});

// Sales list
router.get('/sales', protect, creatorOnly, async (req, res) => {
  const sales = await Order.find({ creator: req.user._id, status: 'paid' })
    .populate('template', 'title previewImage')
    .populate('user', 'name username')
    .sort({ paidAt: -1 });
  res.json(sales);
});

// Wallet info
router.get('/wallet', protect, creatorOnly, async (req, res) => {
  const wallet = await Wallet.findOneAndUpdate(
    { creator: req.user._id },
    { $setOnInsert: { creator: req.user._id, balance: 0, totalEarned: 0, totalWithdrawn: 0 } },
    { upsert: true, new: true }
  );
  res.json(wallet);
});

// Request withdrawal (simple - just decrements balance and logs; integrate M-Pesa B2C in prod)
router.post('/withdraw', protect, creatorOnly, async (req, res) => {
  const { amount, phone } = req.body;
  const amt = Number(amount);
  if (!amt || amt < 100) return res.status(400).json({ error: 'Minimum withdrawal is KES 100' });
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const wallet = await Wallet.findOne({ creator: req.user._id });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  if (wallet.balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

  wallet.balance -= amt;
  wallet.totalWithdrawn += amt;
  wallet.updatedAt = new Date();
  await wallet.save();

  // TODO: integrate Daraja B2C payout here. For now, mark request fulfilled.
  res.json({ message: 'Withdrawal requested', wallet, phone });
});

module.exports = router;
