const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const meetingRoutes = require('./routes/meetings');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');
const cacheRoutes = require('./routes/cache');
const metricsRoutes = require('./routes/metrics');
const { startReminderJob } = require('./jobs/reminders');
const cache = require('./services/cache');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow CORS from your frontend URL
const allowedOrigins = [
    'http://localhost:3000',
    'https://ai-meeting-assistant-frontend-h2po.onrender.com',
    'https://ai-meeting-assistant-frontend.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all in development
        }
    },
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        cache: cache.getStats()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings', aiRoutes);
app.use('/api/meetings', pdfRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/metrics', metricsRoutes);

// Start server
async function start() {
    await initDatabase();
    
    // Start the background job
    startReminderJob();
    
    app.listen(PORT, () => {
        console.log(`🚀 Backend running at http://localhost:${PORT}`);
        console.log(`📚 Health: http://localhost:${PORT}/health`);
        console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
        console.log(`📋 Meetings: http://localhost:${PORT}/api/meetings`);
        console.log(`🧠 AI Process: POST /api/meetings/:id/process`);
        console.log(`📄 PDF: GET /api/meetings/:id/pdf`);
        console.log(`💾 Cache: GET /api/cache/stats`);
        console.log(`⏰ Reminders: Scheduled daily at 9:00 AM`);
    });
}

start().catch(console.error);

module.exports = app;
