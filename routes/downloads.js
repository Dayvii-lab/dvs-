const express = require('express');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const Order = require('../models/Order');
const Template = require('../models/Template');
const Download = require('../models/Download');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Issue a one-time download token (requires PAID order)
router.post('/request/:templateId', protect, async (req, res) => {
  const order = await Order.findOne({
    user: req.user._id,
    template: req.params.templateId,
    status: 'paid',
  });

  if (!order) return res.status(403).json({ error: 'You have not purchased this template' });

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await Download.create({
    user: req.user._id,
    template: order.template,
    order: order._id,
    token,
    expiresAt,
  });

  res.json({ token, expiresAt, url: `/api/downloads/file/${token}` });
});

// Serve the ZIP (protected)
router.get('/file/:token', async (req, res) => {
  try {
    const dl = await Download.findOne({ token: req.params.token });
    if (!dl) return res.status(404).json({ error: 'Invalid download link' });
    if (dl.used) return res.status(410).json({ error: 'Download link already used' });
    if (dl.expiresAt < new Date()) return res.status(410).json({ error: 'Download link expired' });

    // Re-verify order is still paid (extra safety)
    const order = await Order.findById(dl.order);
    if (!order || order.status !== 'paid')
      return res.status(403).json({ error: 'Payment not verified' });

    const template = await Template.findById(dl.template).select('+filePath title');
    if (!template) return res.status(404).json({ error: 'Template missing' });

    const absolute = path.join(__dirname, '..', template.filePath);
    if (!fs.existsSync(absolute))
      return res.status(404).json({ error: 'File missing on server' });

    dl.used = true;
    await dl.save();
    await Template.findByIdAndUpdate(template._id, { $inc: { downloads: 1 } });

    const safeName = template.title.replace(/[^a-z0-9-_]+/gi, '_');
    res.download(absolute, `${safeName}.zip`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
