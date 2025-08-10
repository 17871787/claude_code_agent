/**
 * Productivity Insights Dashboard
 * Interactive UI for smart intelligence insights
 */

class InsightsDashboard {
    constructor() {
        this.insights = [];
        this.focusSessions = [];
        this.weeklyData = null;
        this.visible = false;
        
        this._createUI();
        this._bindEvents();
        this._loadData();
    }
    
    _createUI() {
        // Create insights button in nav
        const nav = document.querySelector('.header nav');
        if (nav && !document.getElementById('btn-insights')) {
            const insightsBtn = document.createElement('button');
            insightsBtn.id = 'btn-insights';
            insightsBtn.className = 'nav-btn';
            insightsBtn.innerHTML = '📊 Insights';
            insightsBtn.title = 'View productivity insights';
            
            // Insert before settings
            const settingsBtn = document.getElementById('btn-settings');
            nav.insertBefore(insightsBtn, settingsBtn);
        }
        
        // Create insights view
        const main = document.querySelector('.main');
        if (main && !document.getElementById('view-insights')) {
            const insightsView = document.createElement('section');
            insightsView.id = 'view-insights';
            insightsView.className = 'view';
            insightsView.innerHTML = `
                <div class="container">
                    <div class="insights-header">
                        <h2>Productivity Insights</h2>
                        <div class="insights-period">
                            <button id="insights-refresh" class="btn-icon" title="Refresh">🔄</button>
                            <select id="insights-range">
                                <option value="today">Today</option>
                                <option value="week" selected>This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="insights-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="stat-total-hours">0h</div>
                            <div class="stat-label">Total Time</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-focus-sessions">0</div>
                            <div class="stat-label">Focus Sessions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-productivity-score">--</div>
                            <div class="stat-label">Productivity Score</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="stat-categories">0</div>
                            <div class="stat-label">Activities</div>
                        </div>
                    </div>
                    
                    <!-- Key Insights -->
                    <div class="insights-cards" id="insights-cards">
                        <!-- Insight cards will be dynamically added here -->
                    </div>
                    
                    <!-- Focus Time Analysis -->
                    <div class="insights-section">
                        <h3>Focus Time Analysis</h3>
                        <div class="focus-chart" id="focus-chart">
                            <canvas id="focus-canvas" width="600" height="200"></canvas>
                        </div>
                        <div class="focus-sessions" id="focus-sessions-list">
                            <!-- Focus sessions will be listed here -->
                        </div>
                    </div>
                    
                    <!-- Category Breakdown -->
                    <div class="insights-section">
                        <h3>Time by Category</h3>
                        <div class="category-chart" id="category-chart">
                            <!-- Category breakdown will be shown here -->
                        </div>
                    </div>
                    
                    <!-- Patterns & Recommendations -->
                    <div class="insights-section">
                        <h3>Patterns & Recommendations</h3>
                        <div class="patterns-list" id="patterns-list">
                            <!-- Patterns will be listed here -->
                        </div>
                    </div>
                    
                    <!-- Smart Suggestions -->
                    <div class="insights-section">
                        <h3>Smart Suggestions</h3>
                        <div class="suggestions-active" id="suggestions-active">
                            <!-- Active suggestions will be shown here -->
                        </div>
                    </div>
                </div>
            `;
            
            main.appendChild(insightsView);
        }
        
        // Add floating insights widget
        this._createFloatingWidget();
    }
    
    _createFloatingWidget() {
        if (document.getElementById('insights-widget')) return;
        
        const widget = document.createElement('div');
        widget.id = 'insights-widget';
        widget.className = 'insights-widget';
        widget.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">Quick Insights</span>
                <button class="widget-toggle">▼</button>
            </div>
            <div class="widget-content">
                <div class="widget-insight" id="widget-current-focus">
                    <span class="widget-label">Current Session:</span>
                    <span class="widget-value">--</span>
                </div>
                <div class="widget-insight" id="widget-today-progress">
                    <span class="widget-label">Today:</span>
                    <span class="widget-value">0h logged</span>
                </div>
                <div class="widget-insight" id="widget-suggestion">
                    <span class="widget-tip">💡 No suggestions yet</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
    }
    
    _bindEvents() {
        // View navigation
        document.getElementById('btn-insights')?.addEventListener('click', () => {
            this.show();
        });
        
        // Refresh button
        document.getElementById('insights-refresh')?.addEventListener('click', () => {
            this.refresh();
        });
        
        // Range selector
        document.getElementById('insights-range')?.addEventListener('change', (e) => {
            this.loadRange(e.target.value);
        });
        
        // Widget toggle
        document.querySelector('.widget-toggle')?.addEventListener('click', () => {
            const widget = document.getElementById('insights-widget');
            widget.classList.toggle('collapsed');
        });
        
        // Listen for entry updates
        window.addEventListener('entry-completed', () => {
            this._updateWidget();
            if (this.visible) {
                this.refresh();
            }
        });
        
        // Listen for timer updates
        window.addEventListener('timer-tick', () => {
            this._updateWidget();
        });
    }
    
    _loadData() {
        if (window.smartIntelligence) {
            // Generate insights
            this.insights = window.smartIntelligence.generateProductivityInsights();
            
            // Get focus sessions
            const entries = this._getRecentEntries(7);
            this.focusSessions = window.smartIntelligence.detectFocusSessions(entries);
            
            // Get weekly summary
            this.weeklyData = window.smartIntelligence.generateWeeklySummary();
            
            // Initial display
            this._displayInsights();
            this._updateWidget();
        }
    }
    
    _displayInsights() {
        // Display insight cards
        const cardsContainer = document.getElementById('insights-cards');
        if (cardsContainer) {
            let cardsHTML = '';
            
            this.insights.forEach(insight => {
                const cardClass = `insight-card insight-${insight.type} priority-${insight.priority}`;
                cardsHTML += `
                    <div class="${cardClass}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                        </div>
                        <button class="insight-action" data-action="${insight.type}">
                            ${this._getActionText(insight.type)}
                        </button>
                    </div>
                `;
            });
            
            cardsContainer.innerHTML = cardsHTML || '<p class="no-insights">No insights available yet. Log more time to see patterns!</p>';
            
            // Bind action buttons
            cardsContainer.querySelectorAll('.insight-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this._handleInsightAction(e.target.dataset.action);
                });
            });
        }
        
        // Update stats
        this._updateStats();
        
        // Display focus sessions
        this._displayFocusSessions();
        
        // Display categories
        this._displayCategories();
        
        // Display patterns
        this._displayPatterns();
        
        // Display suggestions
        this._displaySuggestions();
    }
    
    _updateStats() {
        const range = document.getElementById('insights-range')?.value || 'week';
        const entries = this._getEntriesForRange(range);
        
        // Total hours
        const totalMs = entries.reduce((sum, e) => sum + e.duration, 0);
        const totalHours = Math.round(totalMs / 3600000 * 10) / 10;
        document.getElementById('stat-total-hours').textContent = `${totalHours}h`;
        
        // Focus sessions
        document.getElementById('stat-focus-sessions').textContent = this.focusSessions.length;
        
        // Productivity score
        const score = this._calculateProductivityScore(entries);
        document.getElementById('stat-productivity-score').textContent = score;
        
        // Categories count
        const categories = new Set(entries.map(e => {
            const cat = window.smartIntelligence?.categorizeEntry(e.description);
            return cat?.name || 'uncategorized';
        }));
        document.getElementById('stat-categories').textContent = categories.size;
    }
    
    _calculateProductivityScore(entries) {
        if (entries.length === 0) return '--';
        
        let score = 50; // Base score
        
        // Factor 1: Focus time ratio (+30 points max)
        const focusTime = this.focusSessions.reduce((sum, s) => sum + s.duration, 0);
        const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);
        const focusRatio = totalTime > 0 ? focusTime / totalTime : 0;
        score += Math.round(focusRatio * 30);
        
        // Factor 2: Task completion (+20 points max)
        const avgDuration = totalTime / entries.length;
        const consistencyScore = avgDuration > 1800000 ? 20 : Math.round((avgDuration / 1800000) * 20);
        score += consistencyScore;
        
        // Factor 3: No excessive meetings (-20 points if >40% meetings)
        const meetingTime = entries
            .filter(e => window.smartIntelligence?.categorizeEntry(e.description)?.name === 'meeting')
            .reduce((sum, e) => sum + e.duration, 0);
        const meetingRatio = totalTime > 0 ? meetingTime / totalTime : 0;
        if (meetingRatio > 0.4) {
            score -= 20;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    _displayFocusSessions() {
        const container = document.getElementById('focus-sessions-list');
        if (!container) return;
        
        if (this.focusSessions.length === 0) {
            container.innerHTML = '<p>No focus sessions detected. Focus sessions are 25+ minutes of uninterrupted work.</p>';
            return;
        }
        
        let html = '<div class="focus-sessions-grid">';
        
        this.focusSessions.slice(0, 10).forEach(session => {
            const duration = this._formatDuration(session.duration);
            const time = new Date(session.startTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            const typeIcon = session.type === 'deep' ? '🎯' : session.type === 'extended' ? '⏰' : '✓';
            
            html += `
                <div class="focus-session-card">
                    <div class="focus-type">${typeIcon} ${session.type}</div>
                    <div class="focus-description">${session.description}</div>
                    <div class="focus-meta">
                        <span class="focus-time">${time}</span>
                        <span class="focus-duration">${duration}</span>
                        <span class="focus-score">Score: ${session.focusScore}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Draw focus chart
        this._drawFocusChart();
    }
    
    _drawFocusChart() {
        const canvas = document.getElementById('focus-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Group focus sessions by day
        const dayData = new Map();
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dayData.set(dateStr, 0);
        }
        
        this.focusSessions.forEach(session => {
            const dateStr = new Date(session.startTime).toISOString().split('T')[0];
            if (dayData.has(dateStr)) {
                dayData.set(dateStr, dayData.get(dateStr) + session.duration / 3600000);
            }
        });
        
        // Draw chart
        const barWidth = width / 7 - 20;
        const maxHours = Math.max(...dayData.values()) || 1;
        
        let x = 10;
        dayData.forEach((hours, date) => {
            const barHeight = (hours / maxHours) * (height - 40);
            const y = height - barHeight - 20;
            
            // Draw bar
            ctx.fillStyle = hours > 3 ? '#10b981' : hours > 1 ? '#f59e0b' : '#6b7280';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            const day = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            ctx.fillText(day, x + barWidth / 2, height - 5);
            
            // Draw value
            if (hours > 0) {
                ctx.fillText(`${hours.toFixed(1)}h`, x + barWidth / 2, y - 5);
            }
            
            x += barWidth + 20;
        });
    }
    
    _displayCategories() {
        const container = document.getElementById('category-chart');
        if (!container || !this.weeklyData) return;
        
        let html = '<div class="category-breakdown">';
        let totalTime = 0;
        
        // Calculate total
        this.weeklyData.categories.forEach(cat => {
            totalTime += cat.time;
        });
        
        // Sort by time
        const sorted = Array.from(this.weeklyData.categories.entries())
            .sort((a, b) => b[1].time - a[1].time);
        
        sorted.forEach(([name, data]) => {
            const percentage = totalTime > 0 ? Math.round((data.time / totalTime) * 100) : 0;
            const hours = Math.round(data.time / 3600000 * 10) / 10;
            
            html += `
                <div class="category-item">
                    <div class="category-header">
                        <span class="category-icon">${data.icon}</span>
                        <span class="category-name">${name}</span>
                        <span class="category-stats">${hours}h (${percentage}%)</span>
                    </div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    _displayPatterns() {
        const container = document.getElementById('patterns-list');
        if (!container || !this.weeklyData) return;
        
        if (!this.weeklyData.patterns || this.weeklyData.patterns.length === 0) {
            container.innerHTML = '<p>No patterns detected yet. Keep logging to discover your work patterns!</p>';
            return;
        }
        
        let html = '<div class="patterns-grid">';
        
        this.weeklyData.patterns.forEach(pattern => {
            const icon = pattern.type === 'day-pattern' ? '📅' : 
                         pattern.type === 'time-pattern' ? '⏰' : '🔄';
            
            html += `
                <div class="pattern-card">
                    <span class="pattern-icon">${icon}</span>
                    <span class="pattern-message">${pattern.message}</span>
                    <span class="pattern-confidence">${Math.round(pattern.confidence * 100)}% confidence</span>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    _displaySuggestions() {
        const container = document.getElementById('suggestions-active');
        if (!container) return;
        
        const suggestions = window.smartIntelligence?.generateSmartSuggestions() || [];
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p>No suggestions at this time. Keep working and I\'ll learn your patterns!</p>';
            return;
        }
        
        let html = '<div class="suggestions-list">';
        
        suggestions.forEach(suggestion => {
            const icon = suggestion.type === 'start' ? '🚀' :
                         suggestion.type === 'break' ? '☕' :
                         suggestion.type === 'continue' ? '➡️' :
                         suggestion.type === 'summary' ? '📝' : '💡';
            
            html += `
                <div class="suggestion-item">
                    <span class="suggestion-icon">${icon}</span>
                    <span class="suggestion-text">${suggestion.message}</span>
                    <button class="suggestion-apply" data-action="${suggestion.action}">
                        Apply
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Bind suggestion actions
        container.querySelectorAll('.suggestion-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._applySuggestion(e.target.dataset.action);
            });
        });
    }
    
    _updateWidget() {
        // Update current focus
        const currentFocus = document.getElementById('widget-current-focus');
        if (currentFocus && window.app?.currentTimer) {
            const duration = Date.now() - window.app.currentTimer.startTime;
            const formatted = this._formatDuration(duration);
            currentFocus.querySelector('.widget-value').textContent = formatted;
        } else if (currentFocus) {
            currentFocus.querySelector('.widget-value').textContent = 'Not tracking';
        }
        
        // Update today's progress
        const todayProgress = document.getElementById('widget-today-progress');
        if (todayProgress) {
            const today = new Date().toISOString().split('T')[0];
            const entries = storage.get(`entries_${today}`) || [];
            const totalMs = entries.reduce((sum, e) => sum + e.duration, 0);
            const hours = Math.round(totalMs / 3600000 * 10) / 10;
            todayProgress.querySelector('.widget-value').textContent = `${hours}h logged`;
        }
        
        // Update suggestion
        const suggestionEl = document.getElementById('widget-suggestion');
        if (suggestionEl) {
            const suggestions = window.smartIntelligence?.generateSmartSuggestions() || [];
            if (suggestions.length > 0 && suggestions[0].confidence > 0.6) {
                suggestionEl.querySelector('.widget-tip').textContent = `💡 ${suggestions[0].message}`;
            }
        }
    }
    
    show() {
        // Hide other views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        // Show insights view
        document.getElementById('view-insights')?.classList.add('active');
        document.getElementById('btn-insights')?.classList.add('active');
        
        this.visible = true;
        this.refresh();
    }
    
    refresh() {
        this._loadData();
    }
    
    loadRange(range) {
        // Reload data for different time range
        const days = range === 'today' ? 1 : range === 'week' ? 7 : 30;
        
        // Update insights
        if (window.smartIntelligence) {
            const entries = this._getRecentEntries(days);
            this.focusSessions = window.smartIntelligence.detectFocusSessions(entries);
            
            if (range === 'week') {
                this.weeklyData = window.smartIntelligence.generateWeeklySummary();
            }
        }
        
        this._displayInsights();
    }
    
    _getActionText(type) {
        switch(type) {
            case 'warning': return 'Fix This';
            case 'suggestion': return 'Try It';
            case 'positive': return 'Keep Going';
            case 'insight': return 'Learn More';
            default: return 'Action';
        }
    }
    
    _handleInsightAction(action) {
        // Handle different insight actions
        switch(action) {
            case 'warning':
                // Navigate to settings or relevant view
                document.getElementById('btn-settings')?.click();
                break;
            case 'suggestion':
                // Apply the suggestion
                this.showNotification('Suggestion applied!', 'success');
                break;
            case 'positive':
                // Celebrate
                this.showNotification('Great job! Keep it up! 🎉', 'success');
                break;
        }
    }
    
    _applySuggestion(action) {
        if (action === 'break' || action === 'lunch' || action === 'short-break') {
            // Start a break timer
            document.getElementById('quick-description').value = action === 'lunch' ? 'Lunch break' : 'Break';
            document.getElementById('btn-start-timer')?.click();
        } else if (action === 'changelog') {
            // Switch to changelog view
            document.getElementById('btn-changelog')?.click();
        } else if (action) {
            // Use as description for new timer
            document.getElementById('quick-description').value = action;
            document.getElementById('btn-start-timer')?.click();
        }
        
        this.showNotification('Suggestion applied!', 'success');
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
    
    _getEntriesForRange(range) {
        const days = range === 'today' ? 1 : range === 'week' ? 7 : 30;
        return this._getRecentEntries(days);
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
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.insightsDashboard = new InsightsDashboard();
    });
} else {
    window.insightsDashboard = new InsightsDashboard();
}