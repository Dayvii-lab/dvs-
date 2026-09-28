require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// DB
connectDB();

// Security & parsers
app.use(helmet({
  contentSecurityPolicy: false, // for simplicity with inline scripts (tighten in prod)
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', apiLimiter);

// Static public assets
app.use(express.static(path.join(__dirname, 'public')));
// Previews are public — but NOT the downloadable files
app.use('/previews', express.static(path.join(__dirname, 'uploads', 'previews')));

// Routes
// Routes
const authRoutes = require('./routes/auth');
console.log('AUTH ROUTER:', typeof authRoutes);

const templateRoutes = require('./routes/templates');
console.log('TEMPLATE ROUTER:', typeof templateRoutes);

const orderRoutes = require('./routes/orders');
console.log('ORDER ROUTER:', typeof orderRoutes);

const paymentRoutes = require('./routes/payments');
console.log('PAYMENT ROUTER:', typeof paymentRoutes);

const downloadRoutes = require('./routes/downloads');
console.log('DOWNLOAD ROUTER:', typeof downloadRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/downloads', downloadRoutes);
// Serve pages
const page = (name) => (req, res) =>
  res.sendFile(path.join(__dirname, 'public', name));

app.get('/', page('index.html'));
app.get('/login', page('login.html'));
app.get('/register', page('register.html'));
app.get('/dashboard', page('dashboard.html'));
app.get('/template/:id', page('template.html'));
app.get('/checkout/:id', page('checkout.html'));
app.get('/admin', page('admin.html'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 PixelVault running on port ${PORT}`));
