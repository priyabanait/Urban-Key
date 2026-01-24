import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import sliderRoutes from './routes/sliders.js';
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

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ---------------- SOCKET.IO ----------------
// Socket.IO only works in non-serverless environments
let io;
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_WEBSOCKETS === 'true') {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
  // Mock io for serverless environments
  app.locals.io = {
    emit: () => {},
    to: () => ({ emit: () => {} })
  };
  console.log('⚠️  Socket.IO disabled in serverless mode');
}

// ---------------- MIDDLEWARE ----------------
// ---------------- DATABASE ----------------
// Import the connection helper (must be before routes)
import connectDB from './config/db.js';

// Connect to MongoDB immediately
if (process.env.NODE_ENV !== 'production') {
  // Development: connect once at startup
  connectDB().catch(err => console.error('❌ MongoDB Error:', err));
}

// Database connection middleware for all requests (especially important in serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection error:', err);
    return res.status(503).json({ 
      success: false, 
      message: 'Database connection failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  next();
});

app.use(morgan('dev'));

// ---------------- ROUTES ----------------
app.use('/api/sliders', sliderRoutes);
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

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Society Gate Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      residents: '/api/residents',
      towers: '/api/towers',
      flats: '/api/flats',
      amenities: '/api/amenities',
      bookings: '/api/amenity-bookings'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
