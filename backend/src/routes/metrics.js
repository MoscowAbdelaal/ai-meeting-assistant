const express = require('express');
const { requireAuth } = require('../services/auth');
const { getDb } = require('../database');

const router = express.Router();

router.get('/time-saved', requireAuth, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;

        // Get all meetings
        const meetings = await db.all(
            'SELECT * FROM meetings WHERE user_id = ?',
            [userId]
        );

        // Calculate time saved
        // Assumptions:
        // - Manual processing: 30 minutes per meeting
        // - AI processing: 3 minutes per meeting
        // - Time saved: 27 minutes per meeting
        const totalMeetings = meetings.length;
        const manualTimeMinutes = totalMeetings * 30;
        const aiTimeMinutes = totalMeetings * 3;
        const timeSavedMinutes = manualTimeMinutes - aiTimeMinutes;
        const timeSavedHours = timeSavedMinutes / 60;
        const timeSavedDays = timeSavedHours / 8; // 8-hour workday

        res.json({
            totalMeetings: totalMeetings,
            timeSaved: {
                minutes: Math.round(timeSavedMinutes),
                hours: Math.round(timeSavedHours * 10) / 10,
                days: Math.round(timeSavedDays * 10) / 10,
                workdays: Math.round(timeSavedDays)
            },
            calculation: {
                manualMinutesPerMeeting: 30,
                aiMinutesPerMeeting: 3,
                timeSavedPerMeeting: 27
            },
            message: `You've saved ${Math.round(timeSavedHours)} hours by using AI!`
        });
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Failed to calculate metrics' });
    }
});

module.exports = router;
