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
const { startReminderJob } = require('./jobs/reminders');
const cache = require('./services/cache');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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
