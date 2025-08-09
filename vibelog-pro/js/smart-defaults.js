/**
 * Smart Defaults & Auto-focus System
 * Progressive UX Enhancement - Intelligent form behavior
 */

class SmartDefaults {
    constructor() {
        this.patterns = new Map();
        this.lastValues = new Map();
        this.focusHistory = [];
        
        this._loadPatterns();
        this._initializeDefaults();
        this._bindEvents();
        this._applyInitialFocus();
    }
    
    _loadPatterns() {
        // Load user patterns from storage
        const saved = localStorage.getItem('vl_patterns');
        if (saved) {
            try {
                const patterns = JSON.parse(saved);
                Object.entries(patterns).forEach(([key, value]) => {
                    this.patterns.set(key, value);
                });
            } catch (e) {
                console.warn('Failed to load patterns:', e);
            }
        }
    }
    
    _savePatterns() {
        const patterns = {};
        this.patterns.forEach((value, key) => {
            patterns[key] = value;
        });
        localStorage.setItem('vl_patterns', JSON.stringify(patterns));
    }
    
    _initializeDefaults() {
        // Time-based patterns
        this._initializeTimePatterns();
        
        // Day-based patterns
        this._initializeDayPatterns();
        
        // Project patterns
        this._initializeProjectPatterns();
        
        // User preference patterns
        this._initializePreferencePatterns();
    }
    
    _initializeTimePatterns() {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        // Morning patterns
        if (hour >= 8 && hour < 10) {
            this.patterns.set('morning-standup', {
                time: '09:00-09:15',
                triggers: ['standup', 'daily', 'scrum'],
                description: 'Daily Standup',
                confidence: 0.8
            });
            
            this.patterns.set('morning-email', {
                time: '09:15-10:00',
                triggers: ['email', 'inbox', 'messages'],
                description: 'Email & Messages',
                confidence: 0.6
            });
        }
        
        // Lunch patterns
        if (hour >= 11 && hour < 14) {
            this.patterns.set('lunch', {
                time: '12:00-13:00',
                triggers: ['lunch', 'break', 'food'],
                description: 'Lunch Break',
                confidence: 0.9
            });
        }
        
        // Afternoon patterns
        if (hour >= 14 && hour < 17) {
            this.patterns.set('afternoon-focus', {
                time: `${hour}:00-${hour + 1}:00`,
                triggers: ['development', 'coding', 'implementation'],
                description: 'Development Work',
                confidence: 0.7
            });
        }
        
        // End of day patterns
        if (hour >= 16 && hour < 18) {
            this.patterns.set('daily-review', {
                time: '17:00-17:30',
                triggers: ['review', 'wrap', 'summary'],
                description: 'Daily Review & Planning',
                confidence: 0.6
            });
        }
        
        // Friday patterns
        if (day === 5 && hour >= 15) {
            this.patterns.set('weekly-review', {
                time: '16:00-17:00',
                triggers: ['weekly', 'retrospective', 'planning'],
                description: 'Weekly Review',
                confidence: 0.7
            });
        }
    }
    
    _initializeDayPatterns() {
        const day = new Date().getDay();
        
        // Monday patterns
        if (day === 1) {
            this.patterns.set('monday-planning', {
                triggers: ['planning', 'week', 'goals'],
                description: 'Weekly Planning',
                confidence: 0.7
            });
        }
        
        // Wednesday patterns
        if (day === 3) {
            this.patterns.set('midweek-sync', {
                triggers: ['sync', 'meeting', 'check-in'],
                description: 'Mid-week Sync',
                confidence: 0.5
            });
        }
    }
    
    _initializeProjectPatterns() {
        // Learn from recent entries
        const entries = this._getRecentEntries(7); // Last 7 days
        
        // Find common descriptions
        const descriptionCounts = {};
        entries.forEach(entry => {
            const desc = entry.description.toLowerCase();
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
        });
        
        // Create patterns for frequent tasks
        Object.entries(descriptionCounts).forEach(([desc, count]) => {
            if (count >= 3) { // At least 3 times in last week
                const words = desc.split(' ');
                this.patterns.set(`frequent-${desc}`, {
                    triggers: words,
                    description: desc,
                    confidence: Math.min(0.9, count / 10)
                });
            }
        });
    }
    
    _initializePreferencePatterns() {
        // Load user's common patterns
        const preferences = localStorage.getItem('vl_preferences');
        if (preferences) {
            try {
                const prefs = JSON.parse(preferences);
                
                if (prefs.commonTasks) {
                    prefs.commonTasks.forEach((task, index) => {
                        this.patterns.set(`pref-${index}`, {
                            triggers: task.split(' '),
                            description: task,
                            confidence: 0.8
                        });
                    });
                }
            } catch (e) {
                console.warn('Failed to load preferences:', e);
            }
        }
    }
    
    _bindEvents() {
        // Smart focus management
        this._setupSmartFocus();
        
        // Input suggestions
        this._setupInputSuggestions();
        
        // Form auto-fill
        this._setupAutoFill();
        
        // Learn from user behavior
        this._setupLearning();
    }
    
    _setupSmartFocus() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.focusHistory.push({
                    element: e.target.id,
                    time: Date.now(),
                    view: app.currentView
                });
                
                // Keep only last 20 focus events
                if (this.focusHistory.length > 20) {
                    this.focusHistory.shift();
                }
            }
        });
        
        // Auto-focus on view change
        document.addEventListener('viewchange', (e) => {
            setTimeout(() => {
                this._applySmartFocus(e.detail.view);
            }, 100);
        });
    }
    
    _setupInputSuggestions() {
        const quickInput = document.getElementById('quick-description');
        if (!quickInput) return;
        
        // Create suggestion container
        const suggestions = document.createElement('div');
        suggestions.className = 'smart-suggestions';
        suggestions.style.display = 'none';
        quickInput.parentNode.appendChild(suggestions);
        
        // Input handler
        let suggestionTimeout;
        quickInput.addEventListener('input', (e) => {
            clearTimeout(suggestionTimeout);
            
            // Debounce suggestions
            suggestionTimeout = setTimeout(() => {
                this._showSuggestions(e.target.value, suggestions);
            }, 200);
        });
        
        // Focus handler
        quickInput.addEventListener('focus', () => {
            if (quickInput.value.length === 0) {
                this._showDefaultSuggestions(suggestions);
            }
        });
        
        // Blur handler
        quickInput.addEventListener('blur', () => {
            setTimeout(() => {
                suggestions.style.display = 'none';
            }, 200);
        });
        
        // Keyboard navigation in suggestions
        quickInput.addEventListener('keydown', (e) => {
            if (suggestions.style.display === 'none') return;
            
            const items = suggestions.querySelectorAll('.suggestion-item');
            const selected = suggestions.querySelector('.suggestion-item.selected');
            let index = Array.from(items).indexOf(selected);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    index = Math.min(index + 1, items.length - 1);
                    this._selectSuggestion(items, index);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    index = Math.max(index - 1, 0);
                    this._selectSuggestion(items, index);
                    break;
                case 'Tab':
                    if (selected) {
                        e.preventDefault();
                        quickInput.value = selected.dataset.value;
                        suggestions.style.display = 'none';
                    }
                    break;
            }
        });
    }
    
    _showSuggestions(input, container) {
        if (input.length === 0) {
            this._showDefaultSuggestions(container);
            return;
        }
        
        const inputLower = input.toLowerCase();
        const matches = [];
        
        // Find matching patterns
        this.patterns.forEach((pattern, key) => {
            let score = 0;
            
            // Check triggers
            if (pattern.triggers) {
                pattern.triggers.forEach(trigger => {
                    if (inputLower.includes(trigger) || trigger.includes(inputLower)) {
                        score += pattern.confidence || 0.5;
                    }
                });
            }
            
            // Check description match
            if (pattern.description && pattern.description.toLowerCase().includes(inputLower)) {
                score += 0.3;
            }
            
            if (score > 0) {
                matches.push({
                    description: pattern.description,
                    score: score,
                    source: key
                });
            }
        });
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        // Show top 5 suggestions
        this._renderSuggestions(matches.slice(0, 5), container);
    }
    
    _showDefaultSuggestions(container) {
        const hour = new Date().getHours();
        const suggestions = [];
        
        // Time-based suggestions
        if (hour >= 8 && hour < 10) {
            suggestions.push({ description: 'Daily Standup', score: 0.9 });
            suggestions.push({ description: 'Email & Messages', score: 0.7 });
        } else if (hour >= 11 && hour < 13) {
            suggestions.push({ description: 'Lunch Break', score: 0.9 });
        } else if (hour >= 16 && hour < 18) {
            suggestions.push({ description: 'Daily Review', score: 0.8 });
        }
        
        // Recent entries
        const recent = this._getRecentEntries(1);
        const uniqueRecent = new Set();
        recent.slice(0, 3).forEach(entry => {
            if (!uniqueRecent.has(entry.description)) {
                uniqueRecent.add(entry.description);
                suggestions.push({
                    description: entry.description,
                    score: 0.6,
                    label: 'Recent'
                });
            }
        });
        
        this._renderSuggestions(suggestions, container);
    }
    
    _renderSuggestions(suggestions, container) {
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        let html = '';
        suggestions.forEach((suggestion, index) => {
            const selected = index === 0 ? 'selected' : '';
            const label = suggestion.label ? `<span class="suggestion-label">${suggestion.label}</span>` : '';
            html += `
                <div class="suggestion-item ${selected}" data-value="${suggestion.description}">
                    <span class="suggestion-text">${suggestion.description}</span>
                    ${label}
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('quick-description').value = item.dataset.value;
                container.style.display = 'none';
            });
        });
    }
    
    _selectSuggestion(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    _setupAutoFill() {
        // Auto-fill work hours on first use
        if (!localStorage.getItem('vl_work_hours_set')) {
            const workStart = document.getElementById('work-start');
            const workEnd = document.getElementById('work-end');
            
            if (workStart && workEnd) {
                // Suggest common work hours
                workStart.value = '09:00';
                workEnd.value = '17:00';
                
                // Mark as set when user changes
                workStart.addEventListener('change', () => {
                    localStorage.setItem('vl_work_hours_set', 'true');
                });
            }
        }
        
        // Auto-fill ping interval based on usage
        const entries = this._getRecentEntries(7);
        if (entries.length > 20) {
            // Active user - suggest shorter intervals
            const pingInterval = document.getElementById('ping-interval');
            if (pingInterval && !localStorage.getItem('vl_ping_customized')) {
                pingInterval.value = '30';
            }
        }
    }
    
    _setupLearning() {
        // Learn from completed entries
        document.getElementById('btn-start-timer').addEventListener('click', () => {
            if (app.currentTimer) {
                // Stopping timer - learn from this entry
                const description = app.currentTimer.description;
                this._learnFromEntry(description);
            }
        });
    }
    
    _learnFromEntry(description) {
        // Update pattern confidence
        const descLower = description.toLowerCase();
        const words = descLower.split(' ');
        
        this.patterns.forEach((pattern, key) => {
            if (pattern.description === description) {
                // Exact match - increase confidence
                pattern.confidence = Math.min(1, (pattern.confidence || 0.5) + 0.05);
            } else if (pattern.triggers) {
                // Partial match - slight increase
                const matchCount = pattern.triggers.filter(t => words.includes(t)).length;
                if (matchCount > 0) {
                    pattern.confidence = Math.min(1, (pattern.confidence || 0.5) + 0.01);
                }
            }
        });
        
        // Save updated patterns
        this._savePatterns();
    }
    
    _applyInitialFocus() {
        // Focus on most relevant input based on context
        setTimeout(() => {
            const view = app.currentView;
            
            switch (view) {
                case 'timesheet':
                    document.getElementById('quick-description').focus();
                    break;
                case 'changelog':
                    if (document.getElementById('changelog-entry').value === '') {
                        document.getElementById('changelog-entry').focus();
                    }
                    break;
                case 'settings':
                    // Don't auto-focus in settings
                    break;
            }
        }, 100);
    }
    
    _applySmartFocus(view) {
        // Intelligent focus based on view and context
        switch (view) {
            case 'timesheet':
                const quickInput = document.getElementById('quick-description');
                if (quickInput && !app.currentTimer) {
                    quickInput.focus();
                    quickInput.select();
                }
                break;
                
            case 'board':
                // Focus on first card in Now column if any
                const firstCard = document.querySelector('#board-now .card');
                if (firstCard) {
                    firstCard.focus();
                }
                break;
                
            case 'changelog':
                const changelogEntry = document.getElementById('changelog-entry');
                if (changelogEntry && changelogEntry.value === '') {
                    changelogEntry.focus();
                    
                    // Suggest template if end of day
                    const hour = new Date().getHours();
                    if (hour >= 16 && !changelogEntry.value) {
                        this._suggestChangelogTemplate();
                    }
                }
                break;
        }
    }
    
    _suggestChangelogTemplate() {
        const entries = this._getTodayEntries();
        if (entries.length === 0) return;
        
        // Group entries by description
        const grouped = {};
        let totalTime = 0;
        
        entries.forEach(entry => {
            if (!grouped[entry.description]) {
                grouped[entry.description] = 0;
            }
            grouped[entry.description] += entry.duration;
            totalTime += entry.duration;
        });
        
        // Build template
        let template = `## Today's Work (${this._formatDuration(totalTime)})\n\n`;
        template += `### Completed Tasks\n`;
        
        Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .forEach(([desc, duration]) => {
                template += `- ${desc} (${this._formatDuration(duration)})\n`;
            });
        
        template += `\n### Key Achievements\n- \n\n`;
        template += `### Tomorrow's Focus\n- `;
        
        // Set as placeholder
        const changelogEntry = document.getElementById('changelog-entry');
        if (changelogEntry && !changelogEntry.value) {
            changelogEntry.placeholder = 'Suggested template available. Press Tab to use.';
            changelogEntry.dataset.template = template;
            
            // Tab to accept template
            changelogEntry.addEventListener('keydown', function templateHandler(e) {
                if (e.key === 'Tab' && !changelogEntry.value) {
                    e.preventDefault();
                    changelogEntry.value = template;
                    changelogEntry.removeEventListener('keydown', templateHandler);
                }
            });
        }
    }
    
    _getRecentEntries(days = 1) {
        const entries = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayEntries = storage.get(`entries_${dateStr}`) || [];
            entries.push(...dayEntries);
        }
        
        return entries.sort((a, b) => b.startTime - a.startTime);
    }
    
    _getTodayEntries() {
        const today = new Date().toISOString().split('T')[0];
        return storage.get(`entries_${today}`) || [];
    }
    
    _formatDuration(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartDefaults = new SmartDefaults();
    });
} else {
    window.smartDefaults = new SmartDefaults();
}