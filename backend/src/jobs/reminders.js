const cron = require('node-cron');
const { getDb } = require('../database');
const { sendActionItemReminder } = require('../services/email');

// Run every day at 9:00 AM
// For testing: run every minute: '* * * * *'
const CRON_SCHEDULE = '* * * * *';

async function checkOverdueActionItems() {
    try {
        console.log('🔄 Running action item reminder job...');
        
        const db = await getDb();
        
        // Get all pending action items older than 7 days
        const actions = await db.all(`
            SELECT 
                ai.*,
                m.title as meeting_title,
                m.user_id
            FROM action_items ai
            JOIN meetings m ON ai.meeting_id = m.id
            WHERE ai.status = 'pending'
            AND datetime(ai.created_at) < datetime('now', '-7 days')
        `);

        if (actions.length === 0) {
            console.log('✅ No overdue action items found');
            return;
        }

        console.log(`📌 Found ${actions.length} overdue action items`);

        // Group by user
        const userActions = {};
        for (const action of actions) {
            if (!userActions[action.user_id]) {
                userActions[action.user_id] = [];
            }
            userActions[action.user_id].push(action);
        }

        // Send reminders
        for (const [userId, userActionList] of Object.entries(userActions)) {
            try {
                // Get user email from Supabase
                const { supabase } = require('../services/auth');
                const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
                
                if (error) {
                    console.error(`❌ Could not find user ${userId}:`, error);
                    continue;
                }

                // Send one email per user with all their actions
                for (const action of userActionList) {
                    await sendActionItemReminder(
                        user.email,
                        action,
                        action.meeting_title
                    );
                }
                
                console.log(`📧 Sent reminders to ${user.email} (${userActionList.length} actions)`);
            } catch (error) {
                console.error(`❌ Error sending reminder to user ${userId}:`, error);
            }
        }

        console.log('✅ Reminder job completed');
    } catch (error) {
        console.error('❌ Reminder job error:', error);
    }
}

// Schedule the cron job
function startReminderJob() {
    cron.schedule(CRON_SCHEDULE, checkOverdueActionItems);
    console.log(`⏰ Reminder job scheduled (${CRON_SCHEDULE})`);
    
    // Run once on startup for testing
    console.log('🔍 Running initial check...');
    setTimeout(checkOverdueActionItems, 5000);
}

module.exports = { startReminderJob, checkOverdueActionItems };
