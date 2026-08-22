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

// CORS - Allow all origins for testing
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'AI Meeting Assistant API',
        timestamp: new Date().toISOString(),
        cache: cache.getStats()
    });
});

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
    startReminderJob();

    app.listen(PORT, () => {
        console.log(`🚀 Backend running on port ${PORT}`);
        console.log(`📚 Health: /health`);
        console.log(`🔐 Auth: /api/auth`);
        console.log(`📋 Meetings: /api/meetings`);
        console.log(`🧠 AI: POST /api/meetings/:id/process`);
        console.log(`📄 PDF: GET /api/meetings/:id/pdf`);
    });
}

start().catch(console.error);

module.exports = app;
