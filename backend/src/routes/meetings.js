const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../services/auth');

const router = express.Router();

// All meeting routes require authentication
router.use(requireAuth);

// POST /api/meetings - Create a new meeting
router.post('/', async (req, res) => {
    try {
        const { title, transcript } = req.body;
        const userId = req.user.id;

        if (!title || !transcript) {
            return res.status(400).json({
                error: 'Missing required fields: title, transcript'
            });
        }

        const db = await getDb();
        const id = `meeting_${Date.now()}`;

        await db.run(
            'INSERT INTO meetings (id, user_id, title, transcript) VALUES (?, ?, ?, ?)',
            [id, userId, title, transcript]
        );

        const meeting = await db.get('SELECT * FROM meetings WHERE id = ?', [id]);

        res.status(201).json({
            ...meeting,
            message: 'Meeting created successfully'
        });

    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

// GET /api/meetings - Get all meetings for current user
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        
        const meetings = await db.all(
            'SELECT * FROM meetings WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({ meetings });

    } catch (error) {
        console.error('Error getting meetings:', error);
        res.status(500).json({ error: 'Failed to get meetings' });
    }
});

// GET /api/meetings/:id - Get a meeting by ID
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        
        const meeting = await db.get(
            'SELECT * FROM meetings WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json(meeting);

    } catch (error) {
        console.error('Error getting meeting:', error);
        res.status(500).json({ error: 'Failed to get meeting' });
    }
});

module.exports = router;
