const crypto = require('crypto');

/**
 * Simple in-memory cache with TTL (Time To Live)
 * Stores data in memory with expiration times
 */
class Cache {
    constructor() {
        this.store = new Map();
        this.defaultTTL = 86400; // 24 hours in seconds
    }

    /**
     * Generate a cache key from transcript text
     */
    generateKey(transcript) {
        return crypto
            .createHash('sha256')
            .update(transcript)
            .digest('hex');
    }

    /**
     * Get a value from cache
     */
    get(key) {
        const entry = this.store.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }

        console.log(`💾 Cache HIT for key: ${key.substring(0, 12)}...`);
        return entry.value;
    }

    /**
     * Set a value in cache with TTL
     */
    set(key, value, ttl = this.defaultTTL) {
        this.store.set(key, {
            value: value,
            expiresAt: Date.now() + (ttl * 1000),
            createdAt: Date.now()
        });
        
        console.log(`💾 Cache SET for key: ${key.substring(0, 12)}... (TTL: ${ttl}s)`);
        this._logStats();
    }

    /**
     * Check if a key exists and is valid
     */
    has(key) {
        const entry = this.store.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete a key from cache
     */
    delete(key) {
        this.store.delete(key);
        console.log(`🗑️ Cache DELETED: ${key.substring(0, 12)}...`);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.store.clear();
        console.log('🗑️ Cache CLEARED');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.store.size;
        let valid = 0;
        const now = Date.now();
        
        for (const [key, entry] of this.store) {
            if (now <= entry.expiresAt) {
                valid++;
            }
        }
        
        return {
            totalEntries: total,
            validEntries: valid,
            expiredEntries: total - valid
        };
    }

    /**
     * Log cache statistics
     */
    _logStats() {
        const stats = this.getStats();
        console.log(`📊 Cache Stats: ${stats.validEntries} valid, ${stats.expiredEntries} expired`);
    }

    /**
     * Clean expired entries (runs periodically)
     */
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cache cleaned: ${cleaned} expired entries removed`);
        }
    }
}

// Singleton instance
const cache = new Cache();

// Clean expired entries every hour
setInterval(() => {
    cache.cleanExpired();
}, 3600000); // 1 hour

module.exports = cache;
