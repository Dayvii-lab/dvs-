require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/previews', express.static(path.join(__dirname, 'uploads', 'previews')));
app.use('/portfolios', express.static(path.join(__dirname, 'uploads', 'portfolios')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/downloads', require('./routes/downloads'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/admin', require('./routes/admin'));

// Pages
const page = (name) => (req, res) => res.sendFile(path.join(__dirname, 'public', name));
app.get('/', page('index.html'));
app.get('/login', page('login.html'));
app.get('/register', page('register.html'));
app.get('/creator-register', page('creator-register.html'));
app.get('/creator/dashboard', page('creator-dashboard.html'));
app.get('/creator/upload', page('creator-upload.html'));
app.get('/dashboard', page('dashboard.html'));
app.get('/template/:id', page('template.html'));
app.get('/checkout/:id', page('checkout.html'));
app.get('/admin', page('admin.html'));
app.get('/pending', page('pending.html'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PixelVault' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`🚀 PixelVault running on http://localhost:${PORT}`));
