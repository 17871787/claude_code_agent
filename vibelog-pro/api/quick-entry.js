/**
 * API Endpoint for Quick Entry
 * Receives JSON from ChatGPT or other sources and adds to VibeLog
 */

export default async function handler(req, res) {
    // Enable CORS for external access
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Api-Key'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, duration, timestamp, apiKey, project, category, source } = req.body;

        // Basic validation
        if (!text) {
            return res.status(400).json({ error: 'Text description is required' });
        }

        // Parse duration (default 1 hour if not specified)
        const durationMs = parseDuration(duration || '1h');
        
        // Use provided timestamp or current time
        const entryTime = timestamp ? new Date(timestamp).getTime() : Date.now();
        
        // Create entry object
        const entry = {
            id: generateId(),
            description: text,
            duration: durationMs,
            startTime: entryTime - durationMs,
            endTime: entryTime,
            date: new Date(entryTime).toISOString().split('T')[0],
            source: source || 'api',
            project: project || null,
            category: category || null,
            created: Date.now()
        };

        // If apiKey is provided, validate it (optional security)
        if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Return the formatted entry
        // In a real implementation, this would save to a database
        // For now, return the entry for the client to save
        res.status(200).json({
            success: true,
            entry: entry,
            message: 'Entry created successfully'
        });

    } catch (error) {
        console.error('Error processing entry:', error);
        res.status(500).json({ 
            error: 'Failed to process entry',
            details: error.message 
        });
    }
}

function parseDuration(durationStr) {
    if (typeof durationStr === 'number') return durationStr;
    
    const str = durationStr.toString().toLowerCase();
    let totalMs = 0;
    
    // Parse hours
    const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/);
    if (hoursMatch) {
        totalMs += parseFloat(hoursMatch[1]) * 3600000;
    }
    
    // Parse minutes
    const minsMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)/);
    if (minsMatch) {
        totalMs += parseFloat(minsMatch[1]) * 60000;
    }
    
    // If no units specified, assume hours
    if (totalMs === 0 && /^\d+(?:\.\d+)?$/.test(str)) {
        totalMs = parseFloat(str) * 3600000;
    }
    
    // Default to 1 hour if still 0
    return totalMs || 3600000;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}