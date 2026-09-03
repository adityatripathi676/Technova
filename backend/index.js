require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const app = express();

// ─── 1. HELMET: secure HTTP headers (XSS, clickjack, MIME, etc.) ─────
app.use(helmet());

// ─── 2. TRUST PROXY: needed on Vercel / behind a reverse proxy ────────
app.set('trust proxy', 1);

// ─── 3. GLOBAL RATE LIMIT: 100 req/15 min per IP ─────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── 4. AUTH RATE LIMIT: 10 attempts/15 min per IP ───────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please wait 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);

// ─── 5. CORS: strict origin whitelist ────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (e.g. Vercel SSR) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── 6. BODY PARSING: limit payload size to prevent DoS ──────────────
app.use(express.json({ limit: '15mb' }));

// ─── 7. MONGO SANITIZE: strip $-operator injection from req body/query/params ──
app.use(mongoSanitize());

// ─── 8. CONNECT DB ───────────────────────────────────────────────────
connectDB();

// ─── 9. ROUTES ───────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/approver', require('./routes/approver'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/clubs',         require('./routes/clubs')); // public read-only
app.use('/api/team',          require('./routes/team'));  // public read-only (no private fields)
app.use('/api/notifications', require('./routes/notifications'));

// ─── 10. HEALTH CHECK (no sensitive info) ────────────────────────────
const mongoose = require('mongoose');
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    let dbPing = 'failed';
    if (dbState === 1) {
      // Try a simple ping
      await mongoose.connection.db.admin().ping();
      dbPing = 'success';
    }
    
    res.json({ 
      status: 'ok',
      dbState,
      dbPing,
      env: {
        hasMongo: !!process.env.MONGODB_URI,
        hasJwt: !!process.env.JWT_SECRET,
        hasVapid: !!process.env.VAPID_PUBLIC_KEY
      }
    });
  } catch (err) {
    res.json({ status: 'error', error: err.message, dbState: mongoose.connection.readyState });
  }
});

// ─── 11. 404 FALLBACK (before error handler) ──────────────────────────
app.use('/api/*', (req, res) => res.status(404).json({ message: 'API route not found' }));

// ─── 12. GLOBAL ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode < 500 ? err.message : 'Internal server error')
    : err.message;
  res.status(statusCode).json({ message });
});

// ─── LOCAL DEV SERVER ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
