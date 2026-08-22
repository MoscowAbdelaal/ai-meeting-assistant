const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase } = require('./database');
const meetingRoutes = require('./routes/meetings');

// Inngest will be added in M3 when we implement background jobs
// const { serve } = require('inngest/express');
// const { inngest } = require('./inngest/client');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Meeting routes
app.use('/api/meetings', meetingRoutes);

// Start server
async function start() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Backend running at http://localhost:${PORT}`);
        console.log(`📚 Health: http://localhost:${PORT}/health`);
        console.log(`📋 Meetings: http://localhost:${PORT}/api/meetings`);
    });
}

start().catch(console.error);

module.exports = app;
