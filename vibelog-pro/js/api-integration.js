/**
 * API Integration for External Entry Sources
 * Handles entries from ChatGPT, webhooks, and other integrations
 */

class APIIntegration {
    constructor() {
        this.apiEndpoint = '/api/quick-entry';
        this.pollingInterval = null;
        this.lastSync = localStorage.getItem('vl_last_api_sync') || Date.now();
        
        this._initializeIntegration();
    }
    
    _initializeIntegration() {
        // Add API status indicator to UI
        this._createAPIIndicator();
        
        // Check for pending entries on load
        this._checkPendingEntries();
        
        // Set up automatic gap detection
        this._initGapDetection();
    }
    
    _createAPIIndicator() {
        const header = document.querySelector('.header .container');
        if (header && !document.getElementById('api-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'api-indicator';
            indicator.className = 'api-indicator';
            indicator.innerHTML = `
                <span class="api-status" title="API Integration">🔗</span>
                <span class="api-text">API Ready</span>
            `;
            header.appendChild(indicator);
        }
    }
    
    // ============ Entry Reception ============
    
    async receiveEntry(data) {
        try {
            // Process the entry
            const entry = await this._processIncomingEntry(data);
            
            // Save to storage
            this._saveEntry(entry);
            
            // Update UI if on current date
            if (entry.date === new Date().toISOString().split('T')[0]) {
                this._displayEntry(entry);
            }
            
            // Show notification
            this._showNotification(`Entry added: ${entry.description}`, 'success');
            
            // Update sync timestamp
            this.lastSync = Date.now();
            localStorage.setItem('vl_last_api_sync', this.lastSync);
            
            return { success: true, entry };
        } catch (error) {
            console.error('Error receiving entry:', error);
            this._showNotification('Failed to add entry', 'error');
            return { success: false, error: error.message };
        }
    }
    
    async _processIncomingEntry(data) {
        // Extract and validate entry data
        const entry = {
            id: data.id || this._generateId(),
            description: data.description || data.text || 'Untitled',
            duration: data.duration || 3600000,
            startTime: data.startTime || Date.now() - (data.duration || 3600000),
            endTime: data.endTime || Date.now(),
            date: data.date || new Date().toISOString().split('T')[0],
            source: data.source || 'api',
            category: null,
            tags: []
        };
        
        // Smart categorization if available
        if (window.smartIntelligence) {
            const category = window.smartIntelligence.categorizeEntry(entry.description);
            if (category) {
                entry.category = category.name;
            }
            
            // Get suggested tags
            const tags = window.smartIntelligence.suggestTags(entry.description);
            entry.tags = tags.map(t => t.tag);
        }
        
        // Detect project from description
        const project = this._extractProject(entry.description);
        if (project) {
            entry.project = project;
        }
        
        return entry;
    }
    
    _extractProject(description) {
        // Look for common project patterns
        const patterns = [
            /(?:project|client|customer):\s*([^,\.\;]+)/i,
            /\[([^\]]+)\]/,  // [ProjectName]
            /#(\w+)/,         // #projectname
            /^(\w+):/         // ProjectName: description
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    // ============ Gap Detection ============
    
    _initGapDetection() {
        // Check for gaps every 5 minutes
        setInterval(() => {
            this._detectAndFillGaps();
        }, 300000);
        
        // Initial check
        setTimeout(() => {
            this._detectAndFillGaps();
        }, 5000);
    }
    
    _detectAndFillGaps() {
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        
        if (entries.length === 0) return;
        
        // Sort entries by time
        entries.sort((a, b) => a.startTime - b.startTime);
        
        const gaps = [];
        const workStart = this._getWorkStart();
        const now = Date.now();
        
        // Check gap from work start to first entry
        if (entries[0].startTime > workStart) {
            const gapDuration = entries[0].startTime - workStart;
            if (gapDuration > 1800000) { // > 30 minutes
                gaps.push({
                    start: workStart,
                    end: entries[0].startTime,
                    duration: gapDuration
                });
            }
        }
        
        // Check gaps between entries
        for (let i = 0; i < entries.length - 1; i++) {
            const gap = entries[i + 1].startTime - (entries[i].endTime || entries[i].startTime + entries[i].duration);
            if (gap > 1800000) { // > 30 minutes
                gaps.push({
                    start: entries[i].endTime || entries[i].startTime + entries[i].duration,
                    end: entries[i + 1].startTime,
                    duration: gap
                });
            }
        }
        
        // Check gap from last entry to now
        const lastEntry = entries[entries.length - 1];
        const lastEnd = lastEntry.endTime || lastEntry.startTime + lastEntry.duration;
        if (now - lastEnd > 1800000 && now - lastEnd < 28800000) { // > 30 min, < 8 hours
            gaps.push({
                start: lastEnd,
                end: now,
                duration: now - lastEnd
            });
        }
        
        // Show gap notifications
        if (gaps.length > 0) {
            this._notifyGaps(gaps);
        }
    }
    
    _notifyGaps(gaps) {
        const totalGapTime = gaps.reduce((sum, gap) => sum + gap.duration, 0);
        const hours = Math.round(totalGapTime / 3600000 * 10) / 10;
        
        if (hours > 0.5) {
            // Create gap filling UI
            this._showGapFillingUI(gaps);
        }
    }
    
    _showGapFillingUI(gaps) {
        // Check if already showing
        if (document.getElementById('gap-filler')) return;
        
        const gapFiller = document.createElement('div');
        gapFiller.id = 'gap-filler';
        gapFiller.className = 'gap-filler-popup';
        
        let gapsHTML = '';
        gaps.forEach((gap, index) => {
            const startTime = new Date(gap.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const endTime = new Date(gap.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const duration = this._formatDuration(gap.duration);
            
            gapsHTML += `
                <div class="gap-item" data-index="${index}">
                    <div class="gap-time">${startTime} - ${endTime} (${duration})</div>
                    <input type="text" 
                           class="gap-description" 
                           placeholder="What were you doing?"
                           data-gap-index="${index}">
                    <button class="gap-fill-btn" data-gap-index="${index}">Fill</button>
                    <button class="gap-ignore-btn" data-gap-index="${index}">Ignore</button>
                </div>
            `;
        });
        
        gapFiller.innerHTML = `
            <div class="gap-filler-content">
                <div class="gap-filler-header">
                    <h3>⏰ Time Gaps Detected</h3>
                    <button class="gap-filler-close">&times;</button>
                </div>
                <div class="gap-filler-body">
                    <p>You have unaccounted time. Fill in what you were doing:</p>
                    <div class="gaps-list">
                        ${gapsHTML}
                    </div>
                    <div class="gap-filler-actions">
                        <button id="fill-all-gaps">Fill All as "Working"</button>
                        <button id="ignore-all-gaps">Ignore All</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(gapFiller);
        
        // Bind events
        this._bindGapFillerEvents(gaps);
    }
    
    _bindGapFillerEvents(gaps) {
        // Close button
        document.querySelector('.gap-filler-close')?.addEventListener('click', () => {
            document.getElementById('gap-filler')?.remove();
        });
        
        // Individual gap fill buttons
        document.querySelectorAll('.gap-fill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.gapIndex);
                const input = document.querySelector(`input[data-gap-index="${index}"]`);
                const description = input.value || 'Working';
                
                this._fillGap(gaps[index], description);
                e.target.closest('.gap-item').style.display = 'none';
            });
        });
        
        // Ignore buttons
        document.querySelectorAll('.gap-ignore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.gapIndex);
                e.target.closest('.gap-item').style.display = 'none';
            });
        });
        
        // Fill all button
        document.getElementById('fill-all-gaps')?.addEventListener('click', () => {
            gaps.forEach(gap => {
                this._fillGap(gap, 'Working (unspecified)');
            });
            document.getElementById('gap-filler')?.remove();
        });
        
        // Ignore all button
        document.getElementById('ignore-all-gaps')?.addEventListener('click', () => {
            document.getElementById('gap-filler')?.remove();
        });
    }
    
    _fillGap(gap, description) {
        const entry = {
            id: this._generateId(),
            description: description,
            startTime: gap.start,
            endTime: gap.end,
            duration: gap.duration,
            date: new Date(gap.start).toISOString().split('T')[0],
            source: 'gap-fill',
            category: window.smartIntelligence?.categorizeEntry(description)?.name || null
        };
        
        this._saveEntry(entry);
        this._displayEntry(entry);
        this._showNotification(`Gap filled: ${this._formatDuration(gap.duration)}`, 'success');
    }
    
    // ============ ChatGPT Integration Helper ============
    
    generateChatGPTInstructions() {
        const apiUrl = window.location.origin + '/api/quick-entry';
        const instructions = `
# VibeLog Time Tracking Assistant

You are a time tracking assistant that helps me log my work throughout the day.

## Your Tasks:
1. **Hourly Reminders**: Prompt me every hour to log what I've been working on
2. **Parse Responses**: Convert my voice/text into structured JSON
3. **Send to VibeLog**: POST the entry to my time tracking app

## API Endpoint:
\`\`\`
POST ${apiUrl}
Content-Type: application/json

{
  "text": "Description of work done",
  "duration": "1h",  // or "30m", "1.5h", etc.
  "timestamp": "ISO 8601 timestamp",
  "project": "Project name (if mentioned)",
  "category": "meeting|development|admin|planning|communication|learning|break"
}
\`\`\`

## Response Processing:
When I tell you what I've been doing, extract:
- Main activity description
- Duration (default 1h if not specified)
- Project name (if mentioned)
- Category (infer from keywords)

## Example Interactions:

**You**: "What have you been working on in the last hour?"

**Me**: "I've been in client meetings and then debugging the API"

**Your Processing**:
\`\`\`json
{
  "text": "Client meetings and debugging API",
  "duration": "1h",
  "timestamp": "${new Date().toISOString()}",
  "category": "meeting",
  "project": null
}
\`\`\`

## Keywords for Categories:
- **meeting**: meeting, call, standup, sync, discussion, presentation
- **development**: code, coding, programming, debug, implement, fix, build
- **admin**: email, paperwork, timesheet, expense, invoice
- **planning**: plan, design, architecture, roadmap, estimate
- **communication**: slack, chat, email, message, respond
- **learning**: learn, read, study, research, course, tutorial
- **break**: lunch, coffee, break, walk

## Special Commands:
- "Fill gaps" - Ask me about any unaccounted time
- "Summary" - Give me a summary of today's logged time
- "Categories" - Show time breakdown by category
        `;
        
        return instructions;
    }
    
    showChatGPTSetup() {
        const instructions = this.generateChatGPTInstructions();
        
        const modal = document.createElement('div');
        modal.className = 'chatgpt-setup-modal';
        modal.innerHTML = `
            <div class="setup-content">
                <h2>ChatGPT Integration Setup</h2>
                <p>Copy these instructions to create a Custom GPT:</p>
                <textarea readonly class="setup-instructions">${instructions}</textarea>
                <div class="setup-actions">
                    <button id="copy-instructions">Copy Instructions</button>
                    <button id="close-setup">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('copy-instructions')?.addEventListener('click', () => {
            navigator.clipboard.writeText(instructions);
            this._showNotification('Instructions copied to clipboard!', 'success');
        });
        
        document.getElementById('close-setup')?.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    // ============ Utility Methods ============
    
    _saveEntry(entry) {
        const dateKey = `entries_${entry.date}`;
        let dayEntries = storage.get(dateKey) || [];
        dayEntries.push(entry);
        dayEntries.sort((a, b) => a.startTime - b.startTime);
        storage.set(dateKey, dayEntries);
    }
    
    _displayEntry(entry) {
        if (window.displayEntry) {
            window.displayEntry(entry);
        }
    }
    
    _getWorkStart() {
        const workStartTime = localStorage.getItem('vl_work_start') || '09:00';
        const [hours, minutes] = workStartTime.split(':');
        const start = new Date();
        start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return start.getTime();
    }
    
    _formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    _showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        }
        
        // Update API indicator
        const indicator = document.getElementById('api-indicator');
        if (indicator) {
            indicator.className = `api-indicator ${type}`;
            setTimeout(() => {
                indicator.className = 'api-indicator';
            }, 3000);
        }
    }
    
    _checkPendingEntries() {
        // Could check a queue or external source for pending entries
        console.log('Checking for pending API entries...');
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiIntegration = new APIIntegration();
        
        // Add setup button to settings
        const settingsView = document.getElementById('view-settings');
        if (settingsView) {
            const apiSection = document.createElement('div');
            apiSection.className = 'setting-group';
            apiSection.innerHTML = `
                <h3>API Integration</h3>
                <button id="btn-chatgpt-setup" class="btn-primary">Setup ChatGPT Integration</button>
                <p class="setting-description">
                    Configure ChatGPT to send hourly time logs directly to VibeLog
                </p>
            `;
            settingsView.querySelector('.container').appendChild(apiSection);
            
            document.getElementById('btn-chatgpt-setup')?.addEventListener('click', () => {
                window.apiIntegration.showChatGPTSetup();
            });
        }
    });
} else {
    window.apiIntegration = new APIIntegration();
}