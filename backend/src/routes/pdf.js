const express = require('express');
const { getDb } = require('../database');
const { requireAuth } = require('../services/auth');
const { generateMeetingPDF } = require('../services/pdf');
const fs = require('fs');

const router = express.Router();

// GET /api/meetings/:id/pdf - Generate and download PDF
router.get('/:id/pdf', requireAuth, async (req, res) => {
    try {
        const db = await getDb();
        const meetingId = req.params.id;
        const userId = req.user.id;

        // Get meeting
        const meeting = await db.get(
            'SELECT * FROM meetings WHERE id = ? AND user_id = ?',
            [meetingId, userId]
        );

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Get action items
        const actions = await db.all(
            'SELECT * FROM action_items WHERE meeting_id = ?',
            [meetingId]
        );

        // Generate PDF
        const pdfPath = await generateMeetingPDF(meeting, actions);

        // Send file
        const filename = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.download(pdfPath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Clean up the file after download
            try {
                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
