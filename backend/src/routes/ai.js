const express = require('express');
const { processMeeting } = require('../services/ai');
const { getDb } = require('../database');
const { requireAuth } = require('../services/auth');

const router = express.Router();

// All AI routes require authentication
router.use(requireAuth);

// POST /api/meetings/:id/process - Process meeting with AI
router.post('/:id/process', async (req, res) => {
    try {
        const db = await getDb();
        const meetingId = req.params.id;
        const userId = req.user.id;

        // Get meeting from DB (verify ownership)
        const meeting = await db.get(
            'SELECT * FROM meetings WHERE id = ? AND user_id = ?',
            [meetingId, userId]
        );

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if already processed
        if (meeting.summary) {
            return res.status(400).json({ 
                error: 'Meeting already processed',
                summary: meeting.summary,
                decisions: meeting.decisions
            });
        }

        console.log(`📋 Processing meeting: ${meetingId} - "${meeting.title}"`);

        // Process with AI
        const result = await processMeeting(meeting.transcript);

        // Save summary and decisions to database
        await db.run(
            `UPDATE meetings 
             SET summary = ?, decisions = ? 
             WHERE id = ? AND user_id = ?`,
            [
                result.summary,
                JSON.stringify(result.decisions || []),
                meetingId,
                userId
            ]
        );

        // Save action items
        if (result.actionItems && result.actionItems.length > 0) {
            for (const item of result.actionItems) {
                const actionId = `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                await db.run(
                    `INSERT INTO action_items (id, meeting_id, description, assigned_to) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        actionId,
                        meetingId,
                        item.task,
                        item.assignee || 'Unassigned'
                    ]
                );
            }
            console.log(`✅ Saved ${result.actionItems.length} action items`);
        }

        // Get updated meeting with actions
        const updated = await db.get(
            'SELECT * FROM meetings WHERE id = ? AND user_id = ?',
            [meetingId, userId]
        );
        const actions = await db.all(
            'SELECT * FROM action_items WHERE meeting_id = ?',
            [meetingId]
        );

        res.json({
            ...updated,
            decisions: JSON.parse(updated.decisions || '[]'),
            actionItems: actions,
            _meta: result._meta
        });

    } catch (error) {
        console.error('❌ AI processing route error:', error);
        res.status(500).json({ 
            error: 'Failed to process meeting with AI',
            details: error.message
        });
    }
});

// GET /api/meetings/:id/actions - Get action items for a meeting
router.get('/:id/actions', async (req, res) => {
    try {
        const db = await getDb();
        const meetingId = req.params.id;
        const userId = req.user.id;

        // Verify ownership
        const meeting = await db.get(
            'SELECT * FROM meetings WHERE id = ? AND user_id = ?',
            [meetingId, userId]
        );

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const actions = await db.all(
            'SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at DESC',
            [meetingId]
        );

        res.json({ actionItems: actions });

    } catch (error) {
        console.error('Error getting actions:', error);
        res.status(500).json({ error: 'Failed to get action items' });
    }
});

module.exports = router;
