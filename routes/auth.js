const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// CUSTOMER REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;
    if (!name || !username || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already in use' });
    if (await User.findOne({ username }))
      return res.status(400).json({ error: 'Username taken' });

    const user = await User.create({
      name, username, email, phone, password, role: 'customer', status: 'active',
    });
    const token = signToken(user._id);
    sendCookie(res, token);
    res.json({ user: { id: user._id, name: user.name, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATOR REGISTER (creates pending account)
router.post('/creator/register', async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;
    if (!name || !username || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already in use' });
    if (await User.findOne({ username }))
      return res.status(400).json({ error: 'Username taken' });

    const user = await User.create({
      name, username, email, phone, password, role: 'creator', status: 'pending',
    });
    const token = signToken(user._id);
    sendCookie(res, token);
    res.json({ user: { id: user._id, name: user.name, username: user.username, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN (customer, creator, admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user._id);
    sendCookie(res, token);
    res.json({
      user: {
        id: user._id, name: user.name, username: user.username,
        email: user.email, role: user.role, status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', protect, async (req, res) => {
  const payload = {
    id: req.user._id, name: req.user.name, username: req.user.username,
    email: req.user.email, phone: req.user.phone,
    role: req.user.role, status: req.user.status,
  };
  if (req.user.role === 'creator') {
    const wallet = await Wallet.findOne({ creator: req.user._id });
    payload.wallet = wallet ? { balance: wallet.balance, totalEarned: wallet.totalEarned } : { balance: 0, totalEarned: 0 };
  }
  res.json({ user: payload });
});

module.exports = router;
