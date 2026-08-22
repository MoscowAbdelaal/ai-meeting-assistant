const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('./cache');

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    console.error('📝 Get your key from: https://aistudio.google.com/');
}

// Initialize Gemini
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

console.log('🔑 Gemini API:', geminiApiKey ? '✅ Initialized' : '❌ Not configured');

// Manual fallback parser
function parseMeetingManually(transcript) {
    console.log('📝 Using manual fallback parser...');
    
    const lines = transcript.split('\n');
    const decisions = [];
    const actionItems = [];
    let summaryLines = [];
    
    // Extract summary from first few meaningful lines
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes('Decision:') && !trimmed.includes('Action:') && !trimmed.includes('@')) {
            summaryLines.push(trimmed);
        }
        if (summaryLines.length >= 3) break;
    }
    
    // Extract decisions and action items
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('decision:') || lowerLine.includes('- decision')) {
            const clean = line.replace(/decision:/i, '').replace(/^- /, '').trim();
            if (clean && clean.length > 5) decisions.push(clean);
        }
        
        if (lowerLine.includes('action:') || lowerLine.includes('task:') || line.includes('@')) {
            const clean = line.replace(/action:|task:/i, '').trim();
            const assigneeMatch = clean.match(/@(\w+)/);
            const assignee = assigneeMatch ? assigneeMatch[1] : 'Unassigned';
            const task = clean.replace(/@\w+/, '').trim();
            if (task && task.length > 3) {
                actionItems.push({ task, assignee });
            }
        }
    }
    
    // If no decisions found, look for context clues
    if (decisions.length === 0) {
        const decisionKeywords = ['decided', 'agreed', 'confirmed', 'set', 'will', 'going to'];
        for (const line of lines) {
            for (const keyword of decisionKeywords) {
                if (line.toLowerCase().includes(keyword) && line.length > 10) {
                    decisions.push(line.trim());
                    break;
                }
            }
        }
    }
    
    const summary = summaryLines.join(' ').substring(0, 200) || "Meeting transcript processed";
    
    return {
        summary: summary,
        decisions: decisions.length > 0 ? decisions : ["No specific decisions recorded"],
        actionItems: actionItems.length > 0 ? actionItems : [{ task: "Review meeting notes", assignee: "Team" }]
    };
}

async function processMeeting(transcript) {
    // Check cache first
    const cacheKey = cache.generateKey(transcript);
    
    if (cache.has(cacheKey)) {
        console.log('💾 Returning cached AI result...');
        return cache.get(cacheKey);
    }

    console.log('🤖 Cache miss - calling Gemini API...');

    // Try Gemini if available
    if (genAI) {
        try {
            console.log('🧠 Processing meeting with Gemini AI (gemini-3.1-flash-lite)...');
            console.log('📝 Transcript length:', transcript.length);

            const model = genAI.getGenerativeModel({ 
                model: 'gemini-3.1-flash-lite'
            });
            
            const prompt = `
Extract from this meeting transcript:

1. **Summary**: A 2-3 sentence overview of what was discussed
2. **Decisions**: Key decisions made (list)
3. **Action Items**: Tasks with assignees

Return ONLY valid JSON. No markdown, no code blocks, no explanations:

{
    "summary": "...",
    "decisions": ["decision1", "decision2"],
    "actionItems": [{"task": "...", "assignee": "..."}]
}

Transcript:
${transcript}
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let content = response.text();
            
            console.log('📄 Raw response (first 100 chars):', content.substring(0, 100) + '...');
            
            // Clean the response
            content = content.replace(/```json\s*/g, '');
            content = content.replace(/```\s*/g, '');
            content = content.trim();
            
            // Try to find JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
            
            const parsed = JSON.parse(content);
            
            console.log('✅ Gemini processing successful!');
            console.log('📝 Summary:', parsed.summary?.substring(0, 50) + '...');
            console.log('📋 Decisions:', parsed.decisions?.length || 0);
            console.log('📌 Action Items:', parsed.actionItems?.length || 0);
            
            // Store in cache (TTL: 24 hours)
            cache.set(cacheKey, parsed);
            
            return parsed;
        } catch (error) {
            console.error('❌ Gemini error:', error.message);
            console.log('⚠️ Falling back to manual parser...');
            
            const parsed = parseMeetingManually(transcript);
            // Cache the fallback result too (shorter TTL: 1 hour)
            cache.set(cacheKey, parsed, 3600);
            return parsed;
        }
    }
    
    // Fallback to manual parser
    console.log('⚠️ No AI configured, using manual parser...');
    const parsed = parseMeetingManually(transcript);
    cache.set(cacheKey, parsed, 3600);
    return parsed;
}

module.exports = { processMeeting };
