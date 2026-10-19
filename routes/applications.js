const express = require('express');
const Application = require('../models/Application');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Creator submits application
router.post('/', protect, upload.applicationUpload, async (req, res) => {
  try {
    if (req.user.role !== 'creator')
      return res.status(403).json({ error: 'Only creators can apply' });

    if (req.user.status === 'active')
      return res.status(400).json({ error: 'Already approved' });

    const existing = await Application.findOne({ user: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ error: 'Application already pending' });

    const { coverLetter, experience } = req.body;
    if (!req.files?.resume || !req.files?.portfolio)
      return res.status(400).json({ error: 'Resume and portfolio required' });
    if (!coverLetter)
      return res.status(400).json({ error: 'Cover letter required' });

    const app = await Application.create({
      user: req.user._id,
      resumePath: `uploads/portfolios/${req.files.resume[0].filename}`,
      portfolioPath: `uploads/portfolios/${req.files.portfolio[0].filename}`,
      coverLetter,
      experience: experience || '',
    });

    // Keep user pending
    req.user.status = 'pending';
    await req.user.save();

    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Creator sees their own application status
router.get('/mine', protect, async (req, res) => {
  const apps = await Application.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(apps);
});

// Admin: list all applications
router.get('/', protect, adminOnly, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const apps = await Application.find(filter)
    .populate('user', 'name username email phone createdAt')
    .sort({ createdAt: -1 });
  res.json(apps);
});

// Admin: approve
router.post('/:id/approve', protect, adminOnly, async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });

  app.status = 'approved';
  app.reviewedAt = new Date();
  app.reviewedBy = req.user._id;
  await app.save();

  const creator = await User.findById(app.user);
  creator.status = 'active';
  await creator.save();

  // Create wallet if missing
  await Wallet.findOneAndUpdate(
    { creator: creator._id },
    { $setOnInsert: { creator: creator._id, balance: 0, totalEarned: 0, totalWithdrawn: 0 } },
    { upsert: true }
  );

  res.json({ message: 'Approved', application: app });
});

// Admin: reject
router.post('/:id/reject', protect, adminOnly, async (req, res) => {
  const { note } = req.body;
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });

  app.status = 'rejected';
  app.adminNote = note || '';
  app.reviewedAt = new Date();
  app.reviewedBy = req.user._id;
  await app.save();

  const creator = await User.findById(app.user);
  creator.status = 'rejected';
  await creator.save();

  res.json({ message: 'Rejected', application: app });
});

module.exports = router;
