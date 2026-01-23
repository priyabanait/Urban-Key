import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
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
const io = new Server(httpServer, {
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

// ---------------- MIDDLEWARE ----------------
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

// ---------------- DATABASE ----------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ---------------- ROUTES ----------------
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
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
