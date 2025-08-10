/**
 * Voice Import System
 * Parses voice transcriptions from SuperWhisper, iPhone, LLMs into time entries
 */

class VoiceImport {
    constructor() {
        this.parsers = new Map();
        this.importQueue = [];
        this.previewEntries = [];
        
        this._initializeParsers();
        this._createUI();
        this._bindEvents();
    }
    
    _initializeParsers() {
        // JSON format parser (from LLMs or structured tools)
        this.parsers.set('json', this._parseJSON.bind(this));
        
        // Natural language parser
        this.parsers.set('text', this._parseNaturalLanguage.bind(this));
        
        // SuperWhisper format
        this.parsers.set('superwhisper', this._parseSuperWhisper.bind(this));
        
        // Markdown/bullet list format
        this.parsers.set('markdown', this._parseMarkdown.bind(this));
        
        // CSV format
        this.parsers.set('csv', this._parseCSV.bind(this));
    }
    
    // ============ UI Creation ============
    
    _createUI() {
        // Add import button to header
        const nav = document.querySelector('.header nav');
        if (nav && !document.getElementById('btn-import')) {
            const importBtn = document.createElement('button');
            importBtn.id = 'btn-import';
            importBtn.className = 'nav-btn';
            importBtn.textContent = '🎤 Import';
            importBtn.title = 'Import voice transcriptions';
            nav.appendChild(importBtn);
        }
        
        // Create import modal
        const modal = document.createElement('div');
        modal.id = 'voice-import-modal';
        modal.className = 'voice-import-modal';
        modal.innerHTML = `
            <div class="import-content">
                <div class="import-header">
                    <h2>Import Voice Transcriptions</h2>
                    <button class="import-close">&times;</button>
                </div>
                
                <div class="import-body">
                    <div class="import-instructions">
                        <p>Paste or drop your voice transcription here. Supports:</p>
                        <ul>
                            <li>📝 Natural language ("Worked on project for 2 hours")</li>
                            <li>📊 JSON from LLMs</li>
                            <li>🎙️ SuperWhisper exports</li>
                            <li>📱 iPhone Voice Memos transcripts</li>
                            <li>📋 Markdown lists</li>
                        </ul>
                    </div>
                    
                    <div class="import-dropzone" id="import-dropzone">
                        <textarea id="import-text" placeholder="Paste your transcription here...

Examples:
• 'Spent 2 hours on email and 45 minutes in meetings'
• 'Morning: code review 1h, afternoon: bug fixes 2.5h'
• JSON: [{"task": "Design", "duration": "1h30m"}]"></textarea>
                        <div class="dropzone-overlay">
                            <span>Drop file here</span>
                        </div>
                    </div>
                    
                    <div class="import-controls">
                        <select id="import-format">
                            <option value="auto">Auto-detect format</option>
                            <option value="text">Natural language</option>
                            <option value="json">JSON</option>
                            <option value="markdown">Markdown</option>
                            <option value="csv">CSV</option>
                        </select>
                        <input type="date" id="import-date" value="${new Date().toISOString().split('T')[0]}">
                        <button id="btn-parse" class="btn-primary">Parse</button>
                    </div>
                    
                    <div class="import-preview" id="import-preview" style="display: none;">
                        <h3>Preview Entries</h3>
                        <div class="preview-list" id="preview-list"></div>
                        <div class="preview-actions">
                            <button id="btn-import-all">Import All</button>
                            <button id="btn-clear-preview">Clear</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ============ Event Handlers ============
    
    _bindEvents() {
        // Open modal
        document.getElementById('btn-import')?.addEventListener('click', () => {
            this.openModal();
        });
        
        // Close modal
        document.querySelector('.import-close')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Parse button
        document.getElementById('btn-parse')?.addEventListener('click', () => {
            this.parseInput();
        });
        
        // Import all button
        document.getElementById('btn-import-all')?.addEventListener('click', () => {
            this.importAll();
        });
        
        // Clear preview
        document.getElementById('btn-clear-preview')?.addEventListener('click', () => {
            this.clearPreview();
        });
        
        // Drag and drop
        this._setupDragDrop();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.openModal();
            }
        });
    }
    
    _setupDragDrop() {
        const dropzone = document.getElementById('import-dropzone');
        if (!dropzone) return;
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this._readFile(file);
            }
        });
    }
    
    _readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('import-text').value = e.target.result;
            
            // Auto-detect format from file extension
            if (file.name.endsWith('.json')) {
                document.getElementById('import-format').value = 'json';
            } else if (file.name.endsWith('.md')) {
                document.getElementById('import-format').value = 'markdown';
            } else if (file.name.endsWith('.csv')) {
                document.getElementById('import-format').value = 'csv';
            }
            
            // Auto-parse
            this.parseInput();
        };
        reader.readAsText(file);
    }
    
    // ============ Parsing Methods ============
    
    parseInput() {
        const text = document.getElementById('import-text').value.trim();
        if (!text) {
            this.showNotification('Please enter some text to parse', 'error');
            return;
        }
        
        const format = document.getElementById('import-format').value;
        const date = document.getElementById('import-date').value;
        
        let entries = [];
        
        try {
            if (format === 'auto') {
                entries = this._autoDetectAndParse(text, date);
            } else {
                const parser = this.parsers.get(format);
                if (parser) {
                    entries = parser(text, date);
                }
            }
            
            if (entries.length > 0) {
                this.previewEntries = entries;
                this._showPreview(entries);
            } else {
                this.showNotification('No entries could be parsed from the input', 'warning');
            }
        } catch (error) {
            console.error('Parse error:', error);
            this.showNotification('Error parsing input: ' + error.message, 'error');
        }
    }
    
    _autoDetectAndParse(text, date) {
        // Try JSON first
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
            try {
                return this._parseJSON(text, date);
            } catch (e) {
                // Not JSON, continue
            }
        }
        
        // Check for CSV patterns
        if (text.includes(',') && text.split('\n').length > 1) {
            const lines = text.split('\n');
            if (lines[0].includes(',') && lines[1].includes(',')) {
                return this._parseCSV(text, date);
            }
        }
        
        // Check for markdown bullets
        if (text.includes('- ') || text.includes('* ') || text.includes('• ')) {
            return this._parseMarkdown(text, date);
        }
        
        // Default to natural language
        return this._parseNaturalLanguage(text, date);
    }
    
    _parseJSON(text, date) {
        const data = JSON.parse(text);
        const entries = [];
        
        const items = Array.isArray(data) ? data : [data];
        
        items.forEach(item => {
            const entry = {
                description: item.description || item.task || item.activity || item.title || 'Untitled',
                duration: this._parseDuration(item.duration || item.time || item.hours || '1h'),
                date: item.date || date,
                startTime: item.startTime || item.start || null,
                endTime: item.endTime || item.end || null,
                tags: item.tags || item.categories || [],
                project: item.project || null
            };
            
            // If no explicit times, calculate based on duration
            if (!entry.startTime && entry.duration) {
                const now = Date.now();
                entry.endTime = now;
                entry.startTime = now - entry.duration;
            }
            
            entries.push(entry);
        });
        
        return entries;
    }
    
    _parseNaturalLanguage(text, date) {
        const entries = [];
        
        // Common patterns
        const patterns = [
            // "2 hours on X" or "spent 2h on X"
            /(?:spent?\s+)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s+(?:on\s+)?(.+?)(?:\.|,|;|$)/gi,
            
            // "X for 2 hours" or "X: 2h"
            /(.+?)(?:\s+for\s+|:\s*)(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)(?:\.|,|;|$)/gi,
            
            // "30 minutes of X" or "45m X"
            /(\d+)\s*(?:minutes?|mins?|m)\s+(?:of\s+)?(.+?)(?:\.|,|;|$)/gi,
            
            // "X: 1h30m" or "X - 1 hour 30 minutes"
            /(.+?)(?:\s*[-:]\s*)(\d+)\s*(?:hours?|hrs?|h)(?:\s*(\d+)\s*(?:minutes?|mins?|m))?/gi,
            
            // Time ranges: "9am-11am: meeting"
            /(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?:?\s*(.+?)(?:\.|,|;|$)/gi,
            
            // Simple lists: "email, meeting (1h), coding (2h)"
            /([^,]+?)\s*\((\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h|minutes?|mins?|m)\)/gi
        ];
        
        // Try each pattern
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                let description, duration, startTime, endTime;
                
                if (pattern.source.includes('hours?|hrs?|h')) {
                    // Handle different capture group positions
                    if (match[2] && !isNaN(match[1])) {
                        // Duration first pattern
                        duration = this._parseDuration(match[1] + 'h');
                        description = match[2].trim();
                    } else {
                        // Description first pattern
                        description = match[1].trim();
                        duration = this._parseDuration(match[2] + 'h');
                        
                        // Check for additional minutes
                        if (match[3]) {
                            duration += this._parseDuration(match[3] + 'm');
                        }
                    }
                } else if (pattern.source.includes('minutes?|mins?|m')) {
                    duration = this._parseDuration(match[1] + 'm');
                    description = match[2].trim();
                } else if (pattern.source.includes('am|pm')) {
                    // Time range pattern
                    const start = this._parseTime(match[1]);
                    const end = this._parseTime(match[2]);
                    description = match[3].trim();
                    
                    if (start && end) {
                        startTime = new Date(date + 'T' + start).getTime();
                        endTime = new Date(date + 'T' + end).getTime();
                        duration = endTime - startTime;
                    }
                }
                
                if (description && duration > 0) {
                    entries.push({
                        description: this._cleanDescription(description),
                        duration: duration,
                        date: date,
                        startTime: startTime || null,
                        endTime: endTime || null
                    });
                }
            }
            
            // Reset regex lastIndex
            pattern.lastIndex = 0;
        });
        
        // If no patterns matched, try simple line-by-line parsing
        if (entries.length === 0) {
            const lines = text.split('\n').filter(line => line.trim());
            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine) {
                    // Look for any duration mentions
                    const durationMatch = cleanLine.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h|minutes?|mins?|m)/i);
                    
                    entries.push({
                        description: this._cleanDescription(cleanLine),
                        duration: durationMatch ? this._parseDuration(durationMatch[0]) : 3600000, // Default 1 hour
                        date: date
                    });
                }
            });
        }
        
        return entries;
    }
    
    _parseSuperWhisper(text, date) {
        // SuperWhisper typically outputs clean transcriptions
        // Treat as natural language with potential timestamps
        const entries = this._parseNaturalLanguage(text, date);
        
        // Look for timestamp patterns [00:00:00] or (00:00:00)
        const timestampPattern = /[\[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]/g;
        let match;
        let lastTimestamp = null;
        
        while ((match = timestampPattern.exec(text)) !== null) {
            const timestamp = match[1];
            const time = this._parseTime(timestamp);
            
            if (time && lastTimestamp) {
                // Calculate duration between timestamps
                const duration = this._parseTime(timestamp) - this._parseTime(lastTimestamp);
                
                // Find text between timestamps
                const startIdx = text.indexOf(lastTimestamp) + lastTimestamp.length + 1;
                const endIdx = match.index;
                const description = text.substring(startIdx, endIdx).trim();
                
                if (description && duration > 0) {
                    entries.push({
                        description: this._cleanDescription(description),
                        duration: duration * 1000,
                        date: date
                    });
                }
            }
            
            lastTimestamp = timestamp;
        }
        
        return entries;
    }
    
    _parseMarkdown(text, date) {
        const entries = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            // Remove bullet points
            const cleanLine = line.replace(/^[\s*•\-+]\s*/, '').trim();
            
            if (cleanLine) {
                // Try to extract duration from the line
                const durationMatch = cleanLine.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h|minutes?|mins?|m)/i);
                const duration = durationMatch ? this._parseDuration(durationMatch[0]) : null;
                
                // Clean description by removing duration
                let description = cleanLine;
                if (durationMatch) {
                    description = cleanLine.replace(durationMatch[0], '').trim();
                    description = description.replace(/^[-:,]\s*/, '').replace(/[-:,]\s*$/, '');
                }
                
                if (description) {
                    entries.push({
                        description: this._cleanDescription(description),
                        duration: duration || 3600000, // Default 1 hour
                        date: date
                    });
                }
            }
        });
        
        return entries;
    }
    
    _parseCSV(text, date) {
        const entries = [];
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        // Find column indices
        const descCol = headers.findIndex(h => h.includes('description') || h.includes('task') || h.includes('activity'));
        const durationCol = headers.findIndex(h => h.includes('duration') || h.includes('time') || h.includes('hours'));
        const startCol = headers.findIndex(h => h.includes('start'));
        const endCol = headers.findIndex(h => h.includes('end'));
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length > 0) {
                const entry = {
                    description: values[descCol >= 0 ? descCol : 0] || 'Untitled',
                    duration: this._parseDuration(values[durationCol >= 0 ? durationCol : 1] || '1h'),
                    date: date,
                    startTime: startCol >= 0 ? this._parseTime(values[startCol]) : null,
                    endTime: endCol >= 0 ? this._parseTime(values[endCol]) : null
                };
                
                entries.push(entry);
            }
        }
        
        return entries;
    }
    
    // ============ Helper Methods ============
    
    _parseDuration(text) {
        if (typeof text === 'number') return text;
        
        const str = text.toString().toLowerCase();
        let totalMs = 0;
        
        // Hours
        const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/);
        if (hoursMatch) {
            totalMs += parseFloat(hoursMatch[1]) * 3600000;
        }
        
        // Minutes
        const minsMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)/);
        if (minsMatch) {
            totalMs += parseFloat(minsMatch[1]) * 60000;
        }
        
        // Just a number (assume hours)
        if (totalMs === 0 && /^\d+(?:\.\d+)?$/.test(str)) {
            totalMs = parseFloat(str) * 3600000;
        }
        
        return totalMs;
    }
    
    _parseTime(text) {
        if (!text) return null;
        
        const str = text.toString();
        const match = str.match(/(\d{1,2}):?(\d{2})?:?(\d{2})?/);
        
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            
            // Handle AM/PM
            const isPM = /pm/i.test(str) && hours < 12;
            const isAM = /am/i.test(str) && hours === 12;
            
            const finalHours = isPM ? hours + 12 : (isAM ? 0 : hours);
            
            return `${String(finalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        return null;
    }
    
    _cleanDescription(text) {
        return text
            .replace(/^[-:,•*]\s*/, '')
            .replace(/[-:,]\s*$/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // ============ Preview & Import ============
    
    _showPreview(entries) {
        const preview = document.getElementById('import-preview');
        const list = document.getElementById('preview-list');
        
        let html = '';
        entries.forEach((entry, index) => {
            const duration = this._formatDuration(entry.duration);
            const time = entry.startTime ? 
                `${new Date(entry.startTime).toLocaleTimeString()} - ${new Date(entry.endTime).toLocaleTimeString()}` :
                'No specific time';
            
            html += `
                <div class="preview-entry" data-index="${index}">
                    <input type="checkbox" checked class="preview-check" data-index="${index}">
                    <div class="preview-details">
                        <input type="text" class="preview-description" 
                               value="${entry.description}" 
                               data-index="${index}">
                        <div class="preview-meta">
                            <span class="preview-duration">${duration}</span>
                            <span class="preview-time">${time}</span>
                            <span class="preview-date">${entry.date}</span>
                        </div>
                    </div>
                    <button class="preview-delete" data-index="${index}">×</button>
                </div>
            `;
        });
        
        list.innerHTML = html;
        preview.style.display = 'block';
        
        // Bind preview events
        list.querySelectorAll('.preview-description').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.previewEntries[index].description = e.target.value;
            });
        });
        
        list.querySelectorAll('.preview-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.previewEntries.splice(index, 1);
                this._showPreview(this.previewEntries);
            });
        });
    }
    
    importAll() {
        const checkboxes = document.querySelectorAll('.preview-check:checked');
        const entriesToImport = [];
        
        checkboxes.forEach(cb => {
            const index = parseInt(cb.dataset.index);
            entriesToImport.push(this.previewEntries[index]);
        });
        
        if (entriesToImport.length === 0) {
            this.showNotification('No entries selected for import', 'warning');
            return;
        }
        
        // Import each entry
        let imported = 0;
        entriesToImport.forEach(entry => {
            const now = Date.now();
            const entryData = {
                id: this._generateId(),
                description: entry.description,
                startTime: entry.startTime || now - entry.duration,
                endTime: entry.endTime || now,
                duration: entry.duration,
                date: entry.date
            };
            
            // Save to storage
            const dateKey = `entries_${entry.date}`;
            let dayEntries = storage.get(dateKey) || [];
            dayEntries.push(entryData);
            storage.set(dateKey, dayEntries);
            
            // Update UI if on the same date
            if (entry.date === new Date().toISOString().split('T')[0]) {
                if (window.displayEntry) {
                    displayEntry(entryData);
                }
            }
            
            imported++;
        });
        
        // Create undo command
        if (window.undoSystem) {
            window.undoSystem.execute({
                description: `Import ${imported} entries`,
                execute: () => true,
                undo: () => {
                    // Would remove the imported entries
                    entriesToImport.forEach(entry => {
                        const dateKey = `entries_${entry.date}`;
                        let dayEntries = storage.get(dateKey) || [];
                        dayEntries = dayEntries.filter(e => e.description !== entry.description);
                        storage.set(dateKey, dayEntries);
                    });
                }
            });
        }
        
        this.showNotification(`Successfully imported ${imported} entries`, 'success');
        this.closeModal();
        this.clearPreview();
        
        // Update storage info
        if (window.updateStorageInfo) {
            updateStorageInfo();
        }
    }
    
    clearPreview() {
        this.previewEntries = [];
        document.getElementById('import-preview').style.display = 'none';
        document.getElementById('import-text').value = '';
    }
    
    // ============ Modal Control ============
    
    openModal() {
        const modal = document.getElementById('voice-import-modal');
        modal.classList.add('show');
        document.getElementById('import-text').focus();
    }
    
    closeModal() {
        const modal = document.getElementById('voice-import-modal');
        modal.classList.remove('show');
    }
    
    // ============ Utilities ============
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    _formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(message);
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.voiceImport = new VoiceImport();
    });
} else {
    window.voiceImport = new VoiceImport();
}