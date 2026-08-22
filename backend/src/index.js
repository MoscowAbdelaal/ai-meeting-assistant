const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const meetingRoutes = require('./routes/meetings');
const aiRoutes = require('./routes/ai');

// Debug: Check if API keys are loaded
console.log('🔍 Environment check:');
console.log('📁 .env path:', path.join(__dirname, '../.env'));
console.log('🔑 GEMINI_API_KEY exists?', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log('🔑 GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings', aiRoutes);

// Start server
async function start() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Backend running at http://localhost:${PORT}`);
        console.log(`📚 Health: http://localhost:${PORT}/health`);
        console.log(`📋 Meetings: http://localhost:${PORT}/api/meetings`);
        console.log(`🧠 AI Process: POST /api/meetings/:id/process`);
    });
}

start().catch(console.error);

module.exports = app;
