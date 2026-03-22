require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

const allowedOrigins = [
  'https://colledge-beta.vercel.app',
  'https://colledge.vercel.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(rateLimit({ windowMs: 15*60*1000, max: 500, skip: (req) => req.path === '/api/health' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20, message: { success:false, message:'Too many login attempts' } }));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/institutions',   require('./routes/institutions'));
app.use('/api/students',       require('./routes/students'));
app.use('/api/staff',          require('./routes/staff'));
app.use('/api/academic',       require('./routes/academic'));
app.use('/api/fees',           require('./routes/fees'));
app.use('/api/attendance',     require('./routes/attendance'));
app.use('/api/exams',          require('./routes/exams'));
app.use('/api/admissions',     require('./routes/admissions'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/reports',        require('./routes/reports'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/materials',      require('./routes/materials'));

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  environment: process.env.NODE_ENV,
  frontend: process.env.FRONTEND_URL,
}));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CTIMS API running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
