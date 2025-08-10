/**
 * Smart Intelligence Layer
 * Enhanced pattern recognition and intelligent features (not AI)
 */

class SmartIntelligence {
    constructor() {
        this.categories = new Map();
        this.tags = new Map();
        this.patterns = new Map();
        this.insights = [];
        this.focusSessions = [];
        
        this._initializeCategories();
        this._loadUserPatterns();
        this._startIntelligenceEngine();
    }
    
    // ============ Initialization ============
    
    _initializeCategories() {
        // Pre-defined smart categories with keywords
        this.categories.set('development', {
            keywords: ['code', 'coding', 'programming', 'debug', 'bug', 'feature', 'implement', 'develop', 'test', 'deploy', 'commit', 'pull request', 'pr', 'review', 'refactor', 'fix'],
            color: '#3b82f6',
            icon: '💻',
            confidence: 0.8
        });
        
        this.categories.set('meeting', {
            keywords: ['meeting', 'standup', 'stand-up', 'sync', 'call', 'discussion', 'presentation', 'demo', 'review', 'retrospective', 'retro', '1:1', 'one-on-one', 'conference'],
            color: '#8b5cf6',
            icon: '👥',
            confidence: 0.9
        });
        
        this.categories.set('communication', {
            keywords: ['email', 'slack', 'message', 'chat', 'respond', 'reply', 'write', 'document', 'docs', 'report', 'correspondence'],
            color: '#06b6d4',
            icon: '📧',
            confidence: 0.7
        });
        
        this.categories.set('planning', {
            keywords: ['plan', 'planning', 'strategy', 'roadmap', 'design', 'architect', 'research', 'analyze', 'proposal', 'estimate', 'scope', 'requirement'],
            color: '#10b981',
            icon: '📋',
            confidence: 0.75
        });
        
        this.categories.set('learning', {
            keywords: ['learn', 'study', 'course', 'tutorial', 'read', 'watch', 'training', 'workshop', 'article', 'documentation', 'research'],
            color: '#f59e0b',
            icon: '📚',
            confidence: 0.7
        });
        
        this.categories.set('admin', {
            keywords: ['admin', 'administrative', 'expense', 'timesheet', 'invoice', 'paperwork', 'filing', 'organize', 'setup', 'config', 'install'],
            color: '#6b7280',
            icon: '📁',
            confidence: 0.6
        });
        
        this.categories.set('break', {
            keywords: ['break', 'lunch', 'coffee', 'walk', 'rest', 'pause', 'snack', 'stretch'],
            color: '#84cc16',
            icon: '☕',
            confidence: 0.95
        });
    }
    
    _loadUserPatterns() {
        // Load and analyze user's historical patterns
        const patterns = localStorage.getItem('vl_smart_patterns');
        if (patterns) {
            try {
                const data = JSON.parse(patterns);
                data.forEach(pattern => {
                    this.patterns.set(pattern.id, pattern);
                });
            } catch (e) {
                console.warn('Failed to load smart patterns:', e);
            }
        }
        
        // Analyze recent entries to learn patterns
        this._analyzeHistoricalEntries();
    }
    
    _analyzeHistoricalEntries() {
        const days = 30;
        const entries = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = storage.get(`entries_${dateStr}`) || [];
            entries.push(...dayEntries);
        }
        
        // Learn from user's actual data
        this._learnFromEntries(entries);
    }
    
    _learnFromEntries(entries) {
        // Track word frequency for better categorization
        const wordFrequency = new Map();
        const categoryUsage = new Map();
        
        entries.forEach(entry => {
            const words = this._extractWords(entry.description);
            words.forEach(word => {
                wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
            });
            
            // Track which categories are used
            const category = this.categorizeEntry(entry.description);
            if (category) {
                categoryUsage.set(category.name, (categoryUsage.get(category.name) || 0) + 1);
            }
        });
        
        // Adjust category confidence based on actual usage
        categoryUsage.forEach((count, categoryName) => {
            const category = this.categories.get(categoryName);
            if (category && count > 5) {
                category.confidence = Math.min(0.95, category.confidence + 0.05);
            }
        });
        
        // Identify new patterns
        this._identifyCustomPatterns(wordFrequency, entries);
    }
    
    _identifyCustomPatterns(wordFrequency, entries) {
        // Find frequently used words that aren't in categories
        const customKeywords = [];
        
        wordFrequency.forEach((count, word) => {
            if (count > 5 && word.length > 3) {
                let inCategory = false;
                this.categories.forEach(category => {
                    if (category.keywords.includes(word)) {
                        inCategory = true;
                    }
                });
                
                if (!inCategory) {
                    customKeywords.push({ word, count });
                }
            }
        });
        
        // Create custom tags from frequent words
        customKeywords.sort((a, b) => b.count - a.count).slice(0, 20).forEach(item => {
            this.tags.set(item.word, {
                count: item.count,
                confidence: Math.min(0.9, item.count / 20)
            });
        });
    }
    
    // ============ Smart Categorization ============
    
    categorizeEntry(description) {
        const descLower = description.toLowerCase();
        const words = this._extractWords(descLower);
        
        let bestMatch = null;
        let bestScore = 0;
        
        this.categories.forEach((category, name) => {
            let score = 0;
            let matches = 0;
            
            // Check for keyword matches
            category.keywords.forEach(keyword => {
                if (descLower.includes(keyword)) {
                    score += keyword.length / descLower.length; // Longer matches score higher
                    matches++;
                }
            });
            
            // Adjust score based on confidence and matches
            if (matches > 0) {
                score = (score / matches) * category.confidence;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        name: name,
                        ...category,
                        score: score,
                        matchCount: matches
                    };
                }
            }
        });
        
        // Only return if confidence threshold met
        return bestScore > 0.3 ? bestMatch : null;
    }
    
    suggestTags(description) {
        const descLower = description.toLowerCase();
        const words = this._extractWords(descLower);
        const suggestions = [];
        
        // Check against known tags
        this.tags.forEach((tag, word) => {
            if (descLower.includes(word) && tag.confidence > 0.4) {
                suggestions.push({
                    tag: word,
                    confidence: tag.confidence
                });
            }
        });
        
        // Extract potential project names (capitalized words, acronyms)
        const projectPattern = /\b([A-Z][a-zA-Z]+|[A-Z]{2,})\b/g;
        let match;
        while ((match = projectPattern.exec(description)) !== null) {
            suggestions.push({
                tag: match[1].toLowerCase(),
                confidence: 0.6,
                type: 'project'
            });
        }
        
        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);
        
        return suggestions.slice(0, 5);
    }
    
    // ============ Productivity Insights ============
    
    generateProductivityInsights() {
        const insights = [];
        const entries = this._getRecentEntries(7); // Last 7 days
        
        if (entries.length === 0) return insights;
        
        // 1. Focus time analysis
        const focusAnalysis = this._analyzeFocusTime(entries);
        if (focusAnalysis) insights.push(focusAnalysis);
        
        // 2. Most productive hours
        const productiveHours = this._findProductiveHours(entries);
        if (productiveHours) insights.push(productiveHours);
        
        // 3. Task switching pattern
        const switchingPattern = this._analyzeTaskSwitching(entries);
        if (switchingPattern) insights.push(switchingPattern);
        
        // 4. Category balance
        const categoryBalance = this._analyzeCategoryBalance(entries);
        if (categoryBalance) insights.push(categoryBalance);
        
        // 5. Break patterns
        const breakPattern = this._analyzeBreakPatterns(entries);
        if (breakPattern) insights.push(breakPattern);
        
        // Store insights
        this.insights = insights;
        this._saveInsights();
        
        return insights;
    }
    
    _analyzeFocusTime(entries) {
        const focusSessions = entries.filter(e => e.duration > 1800000); // > 30 min
        const avgFocusDuration = focusSessions.length > 0 ?
            focusSessions.reduce((sum, e) => sum + e.duration, 0) / focusSessions.length : 0;
        
        if (focusSessions.length === 0) {
            return {
                type: 'warning',
                title: 'Limited Focus Time',
                message: 'No focus sessions (>30 min) detected this week. Try blocking time for deep work.',
                icon: '⚠️',
                priority: 'high'
            };
        }
        
        const focusRatio = focusSessions.length / entries.length;
        
        if (focusRatio > 0.4) {
            return {
                type: 'positive',
                title: 'Great Focus Habits',
                message: `${Math.round(focusRatio * 100)}% of your sessions are focused work. Average focus: ${this._formatDuration(avgFocusDuration)}`,
                icon: '🎯',
                priority: 'medium'
            };
        } else {
            return {
                type: 'suggestion',
                title: 'Improve Focus Time',
                message: `Only ${Math.round(focusRatio * 100)}% of sessions are >30 min. Consider batching similar tasks.`,
                icon: '💡',
                priority: 'medium'
            };
        }
    }
    
    _findProductiveHours(entries) {
        const hourlyProductivity = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        
        entries.forEach(entry => {
            const hour = new Date(entry.startTime).getHours();
            hourlyProductivity[hour] += entry.duration;
            hourlyCounts[hour]++;
        });
        
        // Find peak hours
        let maxProductivity = 0;
        let peakHour = -1;
        
        for (let hour = 0; hour < 24; hour++) {
            if (hourlyProductivity[hour] > maxProductivity) {
                maxProductivity = hourlyProductivity[hour];
                peakHour = hour;
            }
        }
        
        if (peakHour >= 0 && hourlyCounts[peakHour] > 2) {
            const nextHour = (peakHour + 1) % 24;
            return {
                type: 'insight',
                title: 'Peak Productivity Hours',
                message: `You're most productive between ${peakHour}:00-${nextHour}:00. Schedule important work during this time.`,
                icon: '📈',
                priority: 'low',
                data: { peakHour, productivity: maxProductivity }
            };
        }
        
        return null;
    }
    
    _analyzeTaskSwitching(entries) {
        if (entries.length < 10) return null;
        
        // Group entries by day
        const entriesByDay = new Map();
        entries.forEach(entry => {
            const day = new Date(entry.startTime).toDateString();
            if (!entriesByDay.has(day)) {
                entriesByDay.set(day, []);
            }
            entriesByDay.get(day).push(entry);
        });
        
        // Calculate average switches per day
        let totalSwitches = 0;
        let daysWithData = 0;
        
        entriesByDay.forEach(dayEntries => {
            if (dayEntries.length > 1) {
                // Count category changes
                let switches = 0;
                for (let i = 1; i < dayEntries.length; i++) {
                    const prevCategory = this.categorizeEntry(dayEntries[i-1].description);
                    const currCategory = this.categorizeEntry(dayEntries[i].description);
                    
                    if (prevCategory?.name !== currCategory?.name) {
                        switches++;
                    }
                }
                totalSwitches += switches;
                daysWithData++;
            }
        });
        
        if (daysWithData === 0) return null;
        
        const avgSwitches = totalSwitches / daysWithData;
        
        if (avgSwitches > 10) {
            return {
                type: 'warning',
                title: 'High Context Switching',
                message: `You switch contexts ~${Math.round(avgSwitches)} times per day. Try batching similar tasks together.`,
                icon: '🔄',
                priority: 'high'
            };
        } else if (avgSwitches < 5) {
            return {
                type: 'positive',
                title: 'Good Task Focus',
                message: `Low context switching (${Math.round(avgSwitches)} per day) helps maintain productivity.`,
                icon: '✅',
                priority: 'low'
            };
        }
        
        return null;
    }
    
    _analyzeCategoryBalance(entries) {
        const categoryTime = new Map();
        let totalTime = 0;
        
        entries.forEach(entry => {
            const category = this.categorizeEntry(entry.description);
            const categoryName = category?.name || 'uncategorized';
            
            categoryTime.set(categoryName, (categoryTime.get(categoryName) || 0) + entry.duration);
            totalTime += entry.duration;
        });
        
        // Find imbalances
        const percentages = new Map();
        categoryTime.forEach((time, category) => {
            percentages.set(category, (time / totalTime) * 100);
        });
        
        // Check for concerning patterns
        const meetingPercent = percentages.get('meeting') || 0;
        const devPercent = percentages.get('development') || 0;
        const adminPercent = percentages.get('admin') || 0;
        
        if (meetingPercent > 40) {
            return {
                type: 'warning',
                title: 'Meeting Heavy',
                message: `${Math.round(meetingPercent)}% of your time is in meetings. Consider declining non-essential meetings.`,
                icon: '📅',
                priority: 'high'
            };
        }
        
        if (adminPercent > 25) {
            return {
                type: 'suggestion',
                title: 'Admin Overhead',
                message: `${Math.round(adminPercent)}% on admin tasks. Look for automation opportunities.`,
                icon: '📊',
                priority: 'medium'
            };
        }
        
        if (devPercent > 0 && devPercent < 30) {
            return {
                type: 'suggestion',
                title: 'Limited Development Time',
                message: `Only ${Math.round(devPercent)}% on development. Block more time for coding.`,
                icon: '💻',
                priority: 'medium'
            };
        }
        
        return null;
    }
    
    _analyzeBreakPatterns(entries) {
        const breakEntries = entries.filter(e => {
            const category = this.categorizeEntry(e.description);
            return category?.name === 'break';
        });
        
        const workDays = new Set();
        entries.forEach(e => {
            workDays.add(new Date(e.startTime).toDateString());
        });
        
        const avgBreaksPerDay = workDays.size > 0 ? breakEntries.length / workDays.size : 0;
        
        if (avgBreaksPerDay < 1 && entries.length > 20) {
            return {
                type: 'warning',
                title: 'Insufficient Breaks',
                message: 'Regular breaks improve focus and prevent burnout. Try the Pomodoro technique.',
                icon: '☕',
                priority: 'medium'
            };
        }
        
        if (avgBreaksPerDay > 5) {
            return {
                type: 'suggestion',
                title: 'Frequent Breaks',
                message: `${Math.round(avgBreaksPerDay)} breaks per day. Consider longer focus sessions.`,
                icon: '⏰',
                priority: 'low'
            };
        }
        
        return null;
    }
    
    // ============ Focus Detection ============
    
    detectFocusSessions(entries) {
        const sessions = [];
        const minFocusDuration = 1500000; // 25 minutes (Pomodoro)
        
        entries.forEach(entry => {
            if (entry.duration >= minFocusDuration) {
                const category = this.categorizeEntry(entry.description);
                
                // Skip breaks and meetings from focus sessions
                if (category?.name !== 'break' && category?.name !== 'meeting') {
                    sessions.push({
                        ...entry,
                        category: category?.name,
                        focusScore: this._calculateFocusScore(entry),
                        type: entry.duration > 5400000 ? 'deep' : // > 90 min
                              entry.duration > 3600000 ? 'extended' : // > 60 min
                              'standard' // 25-60 min
                    });
                }
            }
        });
        
        this.focusSessions = sessions;
        return sessions;
    }
    
    _calculateFocusScore(entry) {
        let score = 0;
        
        // Duration factor
        if (entry.duration > 5400000) score += 40; // > 90 min
        else if (entry.duration > 3600000) score += 30; // > 60 min
        else if (entry.duration > 1800000) score += 20; // > 30 min
        else score += 10;
        
        // Time of day factor (assuming morning/afternoon are better)
        const hour = new Date(entry.startTime).getHours();
        if (hour >= 9 && hour <= 11) score += 20; // Morning focus
        else if (hour >= 14 && hour <= 16) score += 15; // Afternoon focus
        else if (hour >= 20 && hour <= 23) score += 10; // Evening focus
        
        // Category factor
        const category = this.categorizeEntry(entry.description);
        if (category?.name === 'development' || category?.name === 'planning') {
            score += 20;
        }
        
        return Math.min(100, score);
    }
    
    // ============ Smart Suggestions ============
    
    generateSmartSuggestions(context = {}) {
        const suggestions = [];
        const currentHour = new Date().getHours();
        const entries = this._getRecentEntries(1); // Today's entries
        
        // 1. Time-based suggestions
        if (currentHour >= 9 && currentHour <= 10 && entries.length === 0) {
            suggestions.push({
                type: 'start',
                message: 'Start your day with a planning session?',
                action: 'planning',
                confidence: 0.7
            });
        }
        
        if (currentHour >= 12 && currentHour <= 13) {
            const hasLunch = entries.some(e => e.description.toLowerCase().includes('lunch'));
            if (!hasLunch) {
                suggestions.push({
                    type: 'break',
                    message: 'Time for lunch break?',
                    action: 'lunch',
                    confidence: 0.9
                });
            }
        }
        
        // 2. Pattern-based suggestions
        if (app.currentTimer && app.currentTimer.startTime) {
            const duration = Date.now() - app.currentTimer.startTime;
            
            if (duration > 5400000) { // > 90 minutes
                suggestions.push({
                    type: 'break',
                    message: "You've been working for 90+ minutes. Take a break?",
                    action: 'break',
                    confidence: 0.8
                });
            } else if (duration > 1500000 && duration < 1800000) { // ~25-30 min
                suggestions.push({
                    type: 'pomodoro',
                    message: 'Pomodoro complete! Take a 5-minute break?',
                    action: 'short-break',
                    confidence: 0.7
                });
            }
        }
        
        // 3. Continuation suggestions
        if (entries.length > 0 && !app.currentTimer) {
            const lastEntry = entries[entries.length - 1];
            const timeSinceEnd = Date.now() - (lastEntry.endTime || lastEntry.startTime + lastEntry.duration);
            
            if (timeSinceEnd < 1800000) { // Within 30 minutes
                suggestions.push({
                    type: 'continue',
                    message: `Continue "${lastEntry.description}"?`,
                    action: lastEntry.description,
                    confidence: 0.6
                });
            }
        }
        
        // 4. End of day summary
        if (currentHour >= 17 && currentHour <= 18 && entries.length > 3) {
            const hasChangelog = storage.get(`changelog_${new Date().toISOString().split('T')[0]}`);
            if (!hasChangelog) {
                suggestions.push({
                    type: 'summary',
                    message: 'Create daily summary?',
                    action: 'changelog',
                    confidence: 0.7
                });
            }
        }
        
        return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    }
    
    // ============ Weekly Summary ============
    
    generateWeeklySummary() {
        const entries = this._getRecentEntries(7);
        if (entries.length === 0) return null;
        
        const summary = {
            period: this._getWeekPeriod(),
            totalHours: 0,
            totalEntries: entries.length,
            categories: new Map(),
            focusSessions: [],
            insights: [],
            patterns: [],
            suggestions: []
        };
        
        // Calculate totals
        entries.forEach(entry => {
            summary.totalHours += entry.duration / 3600000;
            
            const category = this.categorizeEntry(entry.description);
            const catName = category?.name || 'uncategorized';
            
            if (!summary.categories.has(catName)) {
                summary.categories.set(catName, {
                    time: 0,
                    count: 0,
                    icon: category?.icon || '📌'
                });
            }
            
            const cat = summary.categories.get(catName);
            cat.time += entry.duration;
            cat.count++;
        });
        
        // Detect focus sessions
        summary.focusSessions = this.detectFocusSessions(entries);
        
        // Generate insights
        summary.insights = this.generateProductivityInsights();
        
        // Identify patterns
        summary.patterns = this._identifyWeeklyPatterns(entries);
        
        // Generate suggestions for next week
        summary.suggestions = this._generateWeeklysuggestions(summary);
        
        return summary;
    }
    
    _identifyWeeklyPatterns(entries) {
        const patterns = [];
        
        // Day of week patterns
        const dayActivity = new Array(7).fill(0);
        entries.forEach(entry => {
            const day = new Date(entry.startTime).getDay();
            dayActivity[day] += entry.duration;
        });
        
        const mostProductiveDay = dayActivity.indexOf(Math.max(...dayActivity));
        const leastProductiveDay = dayActivity.indexOf(Math.min(...dayActivity.filter(d => d > 0)));
        
        if (mostProductiveDay >= 0) {
            patterns.push({
                type: 'day-pattern',
                message: `Most productive on ${this._getDayName(mostProductiveDay)}s`,
                confidence: 0.7
            });
        }
        
        // Time patterns
        const morningWork = entries.filter(e => new Date(e.startTime).getHours() < 12);
        const afternoonWork = entries.filter(e => {
            const hour = new Date(e.startTime).getHours();
            return hour >= 12 && hour < 17;
        });
        const eveningWork = entries.filter(e => new Date(e.startTime).getHours() >= 17);
        
        if (morningWork.length > afternoonWork.length * 1.5) {
            patterns.push({
                type: 'time-pattern',
                message: 'Morning person - most work done before noon',
                confidence: 0.8
            });
        } else if (eveningWork.length > afternoonWork.length) {
            patterns.push({
                type: 'time-pattern',
                message: 'Night owl - productive in evenings',
                confidence: 0.8
            });
        }
        
        return patterns;
    }
    
    _generateWeeklysuggestions(summary) {
        const suggestions = [];
        
        // Based on focus sessions
        if (summary.focusSessions.length < 5) {
            suggestions.push({
                type: 'focus',
                message: 'Schedule more deep work blocks next week',
                priority: 'high'
            });
        }
        
        // Based on category balance
        summary.categories.forEach((data, category) => {
            const percentage = (data.time / (summary.totalHours * 3600000)) * 100;
            
            if (category === 'meeting' && percentage > 35) {
                suggestions.push({
                    type: 'balance',
                    message: 'Reduce meeting time to under 30% for more productive work',
                    priority: 'medium'
                });
            }
            
            if (category === 'break' && percentage < 5) {
                suggestions.push({
                    type: 'wellbeing',
                    message: 'Schedule regular breaks to maintain energy',
                    priority: 'medium'
                });
            }
        });
        
        return suggestions;
    }
    
    // ============ Enhanced Voice Parsing ============
    
    enhanceVoiceTranscription(text) {
        // Smart enhancement of voice transcriptions
        let enhanced = text;
        
        // 1. Fix common speech-to-text errors
        const corrections = {
            'our': 'hour',
            'ours': 'hours',
            'too': '2',
            'to': '2',
            'for': '4',
            'fore': '4',
            'ate': '8',
            'won': '1',
            'tree': '3'
        };
        
        // Apply corrections in time contexts
        Object.entries(corrections).forEach(([wrong, right]) => {
            const timePattern = new RegExp(`\\b${wrong}\\s+(hours?|minutes?|mins?)\\b`, 'gi');
            enhanced = enhanced.replace(timePattern, `${right} $1`);
        });
        
        // 2. Expand abbreviations
        const expansions = {
            'mtg': 'meeting',
            'mins': 'minutes',
            'hrs': 'hours',
            'dev': 'development',
            'pr': 'pull request',
            'docs': 'documentation'
        };
        
        Object.entries(expansions).forEach(([abbr, full]) => {
            const pattern = new RegExp(`\\b${abbr}\\b`, 'gi');
            enhanced = enhanced.replace(pattern, full);
        });
        
        // 3. Add smart punctuation for better parsing
        // Add periods after likely sentence ends
        enhanced = enhanced.replace(/(\d+\s+(?:hours?|minutes?))\s+([A-Z])/g, '$1. $2');
        
        // 4. Detect and format time ranges
        enhanced = enhanced.replace(/from\s+(\d{1,2})\s+to\s+(\d{1,2})/gi, '$1:00-$2:00');
        
        // 5. Smart categorization hints
        const categoryHints = {
            'called': 'meeting:',
            'emailed': 'email:',
            'coded': 'development:',
            'debugged': 'development:',
            'planned': 'planning:',
            'reviewed': 'review:'
        };
        
        Object.entries(categoryHints).forEach(([verb, prefix]) => {
            if (enhanced.toLowerCase().includes(verb) && !enhanced.includes(':')) {
                enhanced = enhanced.replace(new RegExp(`\\b${verb}\\b`, 'i'), prefix + ' ' + verb);
            }
        });
        
        return enhanced;
    }
    
    // ============ Utility Methods ============
    
    _extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }
    
    _getRecentEntries(days) {
        const entries = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = storage.get(`entries_${dateStr}`) || [];
            entries.push(...dayEntries);
        }
        
        return entries.sort((a, b) => a.startTime - b.startTime);
    }
    
    _formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    _getDayName(day) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    }
    
    _getWeekPeriod() {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
    }
    
    _saveInsights() {
        localStorage.setItem('vl_smart_insights', JSON.stringify({
            insights: this.insights,
            timestamp: Date.now()
        }));
    }
    
    _savePatterns() {
        const patterns = [];
        this.patterns.forEach((pattern, id) => {
            patterns.push({ id, ...pattern });
        });
        localStorage.setItem('vl_smart_patterns', JSON.stringify(patterns));
    }
    
    // ============ Intelligence Engine ============
    
    _startIntelligenceEngine() {
        // Run periodic analysis
        setInterval(() => {
            this._runIntelligenceAnalysis();
        }, 300000); // Every 5 minutes
        
        // Initial run
        setTimeout(() => {
            this._runIntelligenceAnalysis();
        }, 5000);
    }
    
    _runIntelligenceAnalysis() {
        // Update patterns
        this._analyzeHistoricalEntries();
        
        // Generate fresh insights
        this.generateProductivityInsights();
        
        // Check for smart suggestions
        const suggestions = this.generateSmartSuggestions();
        if (suggestions.length > 0 && suggestions[0].confidence > 0.7) {
            this._showSmartNotification(suggestions[0]);
        }
        
        // Save state
        this._savePatterns();
    }
    
    _showSmartNotification(suggestion) {
        // Only show if not recently shown
        const lastShown = localStorage.getItem('vl_last_smart_notification');
        const timeSinceLastShown = Date.now() - parseInt(lastShown || '0');
        
        if (timeSinceLastShown > 3600000) { // Not shown in last hour
            if (window.showNotification) {
                window.showNotification(suggestion.message, 'info');
            }
            localStorage.setItem('vl_last_smart_notification', String(Date.now()));
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartIntelligence = new SmartIntelligence();
    });
} else {
    window.smartIntelligence = new SmartIntelligence();
}