const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDatabase() {
    db = await open({
        filename: path.join(__dirname, '../meetings.db'),
        driver: sqlite3.Database
    });

    // Create meetings table with user_id
    await db.exec(`
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            transcript TEXT NOT NULL,
            summary TEXT,
            decisions TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create action_items table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS action_items (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            description TEXT NOT NULL,
            assigned_to TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id)
        )
    `);

    console.log('✅ Database ready');
    return db;
}

async function getDb() {
    if (!db) {
        await initDatabase();
    }
    return db;
}

module.exports = { initDatabase, getDb };
