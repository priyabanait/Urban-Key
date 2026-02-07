import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Routes
import serviceRoutes from './routes/service.js';
import advertisementSliderRoutes from './routes/advertisementSlider.js';
import testimonialRoutes from './routes/testimonial.js';
import sliderRoutes from './routes/sliders.js';
import citiesRouter from './routes/city.js';
import amenityBookingRoutes from './routes/amenityBookingRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import authRoutes from './routes/authRoutes.js';
import authenticationRoutes from './routes/authentication.js';
import familyMemberRoutes from './routes/familyMemberRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import helpdeskRoutes from './routes/helpdeskRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import residentRoutes from './routes/residentRoutes.js';
import towerRoutes from './routes/towerRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import petRoutes from './routes/petRoutes.js';
import dailyHelpRoutes from './routes/dailyHelpRoutes.js';
import addressRoutes from './routes/addressRoutes.js';

// DB connection helper
import connectDB from './config/db.js';

// ---------------- ENV VALIDATION ----------------
const validateEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(env => !process.env[env]);

  if (missing.length) {
    console.warn(`⚠️ Missing env vars: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }
};

validateEnv();

const app = express();
const httpServer = createServer(app);

// ---------------- CORS (✅ FIX) ----------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost and specified origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview and production domains
    if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // In production, be more permissive if needed
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ---------------- SOCKET.IO ----------------
let io;

if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_WEBSOCKETS === 'true') {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  app.locals.io = io;

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });
} else {
  app.locals.io = {
    emit: () => {},
    to: () => ({ emit: () => {} })
  };
  console.log('⚠️ Socket.IO disabled (serverless mode)');
}

// ---------------- DATABASE ----------------
if (process.env.NODE_ENV !== 'production') {
  connectDB().catch(err =>
    console.error('❌ MongoDB startup error:', err)
  );
}

app.use(async (req, res, next) => {
  if (req.path === '/health') return next();

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ---------------- MIDDLEWARE ----------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Debug logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ---------------- ROUTES ----------------

app.use('/api/services', serviceRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/advertisementSlider', advertisementSliderRoutes);

app.use('/api/sliders', sliderRoutes);
app.use('/api/cities', citiesRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticationRoutes);
app.use('/api/managers', authRoutes);
app.use('/api/towers', towerRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/members', residentRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/amenity-bookings', amenityBookingRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/daily-help', dailyHelpRoutes);
app.use('/api/addresses', addressRoutes);
// ---------------- ROOT ----------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Society Gate Management API',
    version: '1.0.0'
  });
});

// ---------------- HEALTH ----------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

// IMPORTANT: export app for Vercel
export default app;
