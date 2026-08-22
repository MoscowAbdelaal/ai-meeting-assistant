const express = require('express');
const { requireAuth } = require('../services/auth');
const cache = require('../services/cache');

const router = express.Router();

// GET /api/cache/stats - Get cache statistics
router.get('/stats', requireAuth, (req, res) => {
    const stats = cache.getStats();
    res.json(stats);
});

// DELETE /api/cache - Clear all cache
router.delete('/', requireAuth, (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

module.exports = router;
