// backend/server.js
/**
 * CareOClock Backend Server
 * Main entry point for the Express server
 * Handles middleware setup, routes, database connection, and server initialization
 */

const express = require('express');
const http = require('http');                // Add this
const socketIo = require('socket.io');       // Add this
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

// Route imports
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const intakeRoutes = require('./routes/intake');
const healthRoutes = require('./routes/health');
const alertRoutes = require('./routes/alerts');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/user');
const predictRoutes = require('./routes/predict');
// const doctorNotesRoutes = require('./routes/doctorNotes');
const adherenceRoutes = require('./routes/adherence');
const requestRoutes = require('./routes/requestRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server from Express app
const server = http.createServer(app);

// Setup Socket.IO with CORS allowing frontend origin
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Basic Socket.IO connection handlers
io.on('connection', (socket) => {
    console.log('New client connected: ', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });

    // You can add more custom socket events here
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
}

// Health check endpoint
app.get('/api/health/check', (req, res) => {
    res.status(200).json({
        message: 'CareOClock API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
app.use(express.json())
// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/adherence-stats', protect, adherenceRoutes);
app.use('/api/requests', protect, requestRoutes);

// app.use('/api/doctor-notes', doctorNotesRoutes);

// Handle undefined routes
// app.all('*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`
//     });
// });

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 CareOClock Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
