const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ────────────────────────────────────────────────
// protect — verifies JWT cookie and loads req.user
// ────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      console.warn('[auth] No token cookie on', req.method, req.originalUrl);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('[auth] JWT verify failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      console.warn('[auth] User not found for id', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] protect error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ────────────────────────────────────────────────
// adminOnly — requires role === 'admin'
// ────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    console.warn('[auth] Admin required, got role:', req.user?.role);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ────────────────────────────────────────────────
// creatorOnly — requires role === 'creator' AND status === 'active'
// ────────────────────────────────────────────────
exports.creatorOnly = (req, res, next) => {
  if (req.user?.role !== 'creator') {
    console.warn('[auth] Creator role required, got:', req.user?.role);
    return res.status(403).json({ error: 'Creator access required' });
  }
  if (req.user?.status !== 'active') {
    console.warn('[auth] Creator not approved, status:', req.user?.status);
    return res.status(403).json({ error: 'Creator account not yet approved' });
  }
  next();
};
