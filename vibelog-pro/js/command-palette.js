/**
 * Command Palette - Fuzzy search for all actions
 * Progressive UX Enhancement
 */

class CommandPalette {
    constructor() {
        this.commands = [];
        this.isOpen = false;
        this.selectedIndex = 0;
        this.searchTerm = '';
        
        this._initializeCommands();
        this._createUI();
    }
    
    _initializeCommands() {
        this.commands = [
            // Navigation
            { id: 'nav-timesheet', label: 'Go to Timesheet', action: () => this._switchView('timesheet'), category: 'Navigation' },
            { id: 'nav-board', label: 'Go to Board', action: () => this._switchView('board'), category: 'Navigation' },
            { id: 'nav-changelog', label: 'Go to Changelog', action: () => this._switchView('changelog'), category: 'Navigation' },
            { id: 'nav-settings', label: 'Go to Settings', action: () => this._switchView('settings'), category: 'Navigation' },
            
            // Timer Actions
            { id: 'timer-start', label: 'Start Timer', action: () => this._startTimer(), category: 'Timer' },
            { id: 'timer-stop', label: 'Stop Timer', action: () => this._stopTimer(), category: 'Timer' },
            { id: 'timer-toggle', label: 'Toggle Timer', action: () => this._toggleTimer(), category: 'Timer' },
            { id: 'entry-new', label: 'New Time Entry', action: () => this._newEntry(), category: 'Timer' },
            
            // Data Management
            { id: 'export-csv', label: 'Export to CSV', action: () => this._exportCSV(), category: 'Export' },
            { id: 'export-markdown', label: 'Export to Markdown', action: () => this._exportMarkdown(), category: 'Export' },
            { id: 'export-json', label: 'Export to JSON', action: () => this._exportJSON(), category: 'Export' },
            { id: 'clear-today', label: 'Clear Today\'s Entries', action: () => this._clearToday(), category: 'Data' },
            { id: 'clear-all', label: 'Clear All Data', action: () => this._clearAll(), category: 'Data' },
            
            // Settings
            { id: 'toggle-compression', label: 'Toggle Compression', action: () => this._toggleCompression(), category: 'Settings' },
            { id: 'toggle-pings', label: 'Toggle Time Pings', action: () => this._togglePings(), category: 'Settings' },
            { id: 'set-work-hours', label: 'Set Work Hours', action: () => this._setWorkHours(), category: 'Settings' },
            
            // Board Actions
            { id: 'board-new-task', label: 'New Task', action: () => this._newTask(), category: 'Board' },
            { id: 'board-move-now', label: 'Move to Now', action: () => this._moveToNow(), category: 'Board' },
            { id: 'board-move-next', label: 'Move to Next', action: () => this._moveToNext(), category: 'Board' },
            { id: 'board-move-later', label: 'Move to Later', action: () => this._moveToLater(), category: 'Board' },
            
            // Changelog
            { id: 'changelog-save', label: 'Save Daily Summary', action: () => this._saveSummary(), category: 'Changelog' },
            { id: 'changelog-template', label: 'Load Template', action: () => this._loadTemplate(), category: 'Changelog' },
            
            // Help
            { id: 'help-shortcuts', label: 'Show Keyboard Shortcuts', action: () => this._showHelp(), category: 'Help' },
            { id: 'help-about', label: 'About VibeLog Pro', action: () => this._showAbout(), category: 'Help' },
            
            // Quick Actions
            { id: 'quick-break', label: 'Start Break', action: () => this._startBreak(), category: 'Quick' },
            { id: 'quick-lunch', label: 'Start Lunch', action: () => this._startLunch(), category: 'Quick' },
            { id: 'quick-meeting', label: 'Start Meeting', action: () => this._startMeeting(), category: 'Quick' },
            { id: 'quick-focus', label: 'Start Focus Time', action: () => this._startFocus(), category: 'Quick' },
            
            // Analysis
            { id: 'stats-today', label: 'Today\'s Statistics', action: () => this._showTodayStats(), category: 'Analysis' },
            { id: 'stats-week', label: 'This Week\'s Statistics', action: () => this._showWeekStats(), category: 'Analysis' },
            { id: 'stats-month', label: 'This Month\'s Statistics', action: () => this._showMonthStats(), category: 'Analysis' },
        ];
        
        // Add dynamic commands based on recent entries
        this._addRecentCommands();
    }
    
    _addRecentCommands() {
        // Get recent entry descriptions from storage
        const recentEntries = this._getRecentEntries();
        recentEntries.forEach((entry, index) => {
            this.commands.push({
                id: `recent-${index}`,
                label: `Continue: ${entry.description}`,
                action: () => this._continueEntry(entry.description),
                category: 'Recent'
            });
        });
    }
    
    _getRecentEntries() {
        // Get unique recent entries
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        
        const unique = {};
        entries.forEach(entry => {
            if (!unique[entry.description]) {
                unique[entry.description] = entry;
            }
        });
        
        return Object.values(unique).slice(-5).reverse();
    }
    
    _createUI() {
        // Create palette container
        this.container = document.createElement('div');
        this.container.id = 'command-palette';
        this.container.className = 'command-palette';
        this.container.innerHTML = `
            <div class="palette-modal">
                <input type="text" 
                       id="palette-search" 
                       class="palette-search" 
                       placeholder="Type a command or search..."
                       autocomplete="off">
                <div class="palette-results" id="palette-results"></div>
                <div class="palette-footer">
                    <span><kbd>↑↓</kbd> Navigate</span>
                    <span><kbd>Enter</kbd> Select</span>
                    <span><kbd>Esc</kbd> Close</span>
                </div>
            </div>
        `;
        
        // Add to body but keep hidden
        document.body.appendChild(this.container);
        
        // Bind events
        this.searchInput = document.getElementById('palette-search');
        this.resultsContainer = document.getElementById('palette-results');
        
        this.searchInput.addEventListener('input', (e) => this._handleSearch(e));
        this.searchInput.addEventListener('keydown', (e) => this._handleKeydown(e));
        
        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });
    }
    
    open() {
        this.isOpen = true;
        this.searchTerm = '';
        this.selectedIndex = 0;
        
        // Reset and show
        this.searchInput.value = '';
        this.container.classList.add('show');
        this.searchInput.focus();
        
        // Show all commands initially
        this._renderResults(this.commands);
        
        // Add escape handler
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }
    
    close() {
        this.isOpen = false;
        this.container.classList.remove('show');
        
        // Remove escape handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Return focus
        if (window.keyboardNav) {
            window.keyboardNav._enterNormalMode();
        }
    }
    
    _handleSearch(e) {
        this.searchTerm = e.target.value.toLowerCase();
        this.selectedIndex = 0;
        
        if (this.searchTerm === '') {
            this._renderResults(this.commands);
        } else {
            const filtered = this._fuzzySearch(this.searchTerm);
            this._renderResults(filtered);
        }
    }
    
    _fuzzySearch(term) {
        const results = [];
        
        this.commands.forEach(cmd => {
            const score = this._fuzzyScore(term, cmd.label.toLowerCase());
            if (score > 0) {
                results.push({ ...cmd, score });
            }
        });
        
        // Sort by score
        results.sort((a, b) => b.score - a.score);
        
        return results;
    }
    
    _fuzzyScore(search, target) {
        let score = 0;
        let searchIndex = 0;
        let targetIndex = 0;
        let consecutiveMatches = 0;
        
        while (searchIndex < search.length && targetIndex < target.length) {
            if (search[searchIndex] === target[targetIndex]) {
                score += 1 + consecutiveMatches;
                consecutiveMatches++;
                searchIndex++;
            } else {
                consecutiveMatches = 0;
            }
            targetIndex++;
        }
        
        // All characters matched
        if (searchIndex === search.length) {
            // Bonus for shorter targets
            score += (50 / target.length);
            
            // Bonus for exact match
            if (search === target) {
                score += 100;
            }
            
            // Bonus for start match
            if (target.startsWith(search)) {
                score += 50;
            }
            
            return score;
        }
        
        return 0;
    }
    
    _renderResults(commands) {
        if (commands.length === 0) {
            this.resultsContainer.innerHTML = '<div class="palette-empty">No commands found</div>';
            return;
        }
        
        // Group by category
        const grouped = {};
        commands.forEach(cmd => {
            if (!grouped[cmd.category]) {
                grouped[cmd.category] = [];
            }
            grouped[cmd.category].push(cmd);
        });
        
        let html = '';
        let index = 0;
        
        Object.entries(grouped).forEach(([category, cmds]) => {
            html += `<div class="palette-category">${category}</div>`;
            cmds.forEach(cmd => {
                const selected = index === this.selectedIndex ? 'selected' : '';
                html += `
                    <div class="palette-item ${selected}" data-index="${index}">
                        <span class="palette-label">${this._highlightMatch(cmd.label)}</span>
                    </div>
                `;
                index++;
            });
        });
        
        this.resultsContainer.innerHTML = html;
        
        // Add click handlers
        this.resultsContainer.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.index);
                this.selectedIndex = idx;
                this._executeSelected();
            });
            
            item.addEventListener('mouseenter', () => {
                const idx = parseInt(item.dataset.index);
                this.selectedIndex = idx;
                this._updateSelection();
            });
        });
        
        // Ensure selected item is visible
        this._scrollToSelected();
    }
    
    _highlightMatch(text) {
        if (!this.searchTerm) return text;
        
        let highlighted = '';
        let textLower = text.toLowerCase();
        let searchIndex = 0;
        
        for (let i = 0; i < text.length; i++) {
            if (searchIndex < this.searchTerm.length && 
                textLower[i] === this.searchTerm[searchIndex]) {
                highlighted += `<mark>${text[i]}</mark>`;
                searchIndex++;
            } else {
                highlighted += text[i];
            }
        }
        
        return highlighted;
    }
    
    _handleKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._moveSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._moveSelection(-1);
                break;
            case 'Enter':
                e.preventDefault();
                this._executeSelected();
                break;
            case 'Tab':
                e.preventDefault();
                this._moveSelection(e.shiftKey ? -1 : 1);
                break;
        }
    }
    
    _moveSelection(delta) {
        const items = this.resultsContainer.querySelectorAll('.palette-item');
        const max = items.length - 1;
        
        this.selectedIndex = Math.max(0, Math.min(max, this.selectedIndex + delta));
        this._updateSelection();
        this._scrollToSelected();
    }
    
    _updateSelection() {
        this.resultsContainer.querySelectorAll('.palette-item').forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    _scrollToSelected() {
        const selected = this.resultsContainer.querySelector('.palette-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    _executeSelected() {
        const filtered = this.searchTerm ? this._fuzzySearch(this.searchTerm) : this.commands;
        const command = filtered[this.selectedIndex];
        
        if (command) {
            this.close();
            command.action();
        }
    }
    
    // Command Actions
    _switchView(view) {
        document.getElementById(`btn-${view}`).click();
    }
    
    _startTimer() {
        if (!app.currentTimer) {
            document.getElementById('btn-start-timer').click();
        }
    }
    
    _stopTimer() {
        if (app.currentTimer) {
            document.getElementById('btn-start-timer').click();
        }
    }
    
    _toggleTimer() {
        document.getElementById('btn-start-timer').click();
    }
    
    _newEntry() {
        this._switchView('timesheet');
        document.getElementById('quick-description').focus();
    }
    
    _exportCSV() {
        document.getElementById('btn-export-csv').click();
    }
    
    _exportMarkdown() {
        document.getElementById('btn-export-markdown').click();
    }
    
    _exportJSON() {
        const entries = getAllEntries();
        const json = JSON.stringify(entries, null, 2);
        downloadFile('vibelog-export.json', json, 'application/json');
    }
    
    _clearToday() {
        if (confirm('Clear all entries for today?')) {
            const today = new Date().toISOString().split('T')[0];
            storage.delete(`entries_${today}`);
            document.getElementById('today-entries').innerHTML = '';
            showNotification('Today\'s entries cleared');
        }
    }
    
    _clearAll() {
        document.getElementById('btn-clear-data').click();
    }
    
    _toggleCompression() {
        storage.compressionEnabled = !storage.compressionEnabled;
        showNotification(`Compression ${storage.compressionEnabled ? 'enabled' : 'disabled'}`);
    }
    
    _togglePings() {
        document.getElementById('ping-enabled').click();
    }
    
    _setWorkHours() {
        this._switchView('settings');
        document.getElementById('work-start').focus();
    }
    
    _newTask() {
        // Would implement task creation
        showNotification('Task creation coming soon');
    }
    
    _moveToNow() {
        // Would implement board movement
        showNotification('Board management coming soon');
    }
    
    _moveToNext() {
        showNotification('Board management coming soon');
    }
    
    _moveToLater() {
        showNotification('Board management coming soon');
    }
    
    _saveSummary() {
        this._switchView('changelog');
        const form = document.getElementById('changelog-form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    _loadTemplate() {
        const template = `## Today's Accomplishments
- 
- 
- 

## Challenges
- 

## Tomorrow's Focus
- `;
        
        document.getElementById('changelog-entry').value = template;
        showNotification('Template loaded');
    }
    
    _showHelp() {
        if (window.keyboardNav) {
            window.keyboardNav._showHelp();
        }
    }
    
    _showAbout() {
        alert('VibeLog Pro v1.0.0\nOffline-first time tracking\nBuilt with Progressive UX principles');
    }
    
    _startBreak() {
        this._quickEntry('Break');
    }
    
    _startLunch() {
        this._quickEntry('Lunch');
    }
    
    _startMeeting() {
        this._quickEntry('Meeting');
    }
    
    _startFocus() {
        this._quickEntry('Focus Time');
    }
    
    _quickEntry(description) {
        document.getElementById('quick-description').value = description;
        document.getElementById('btn-start-timer').click();
    }
    
    _continueEntry(description) {
        document.getElementById('quick-description').value = description;
        document.getElementById('btn-start-timer').click();
    }
    
    _showTodayStats() {
        // Calculate today's stats
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        
        let totalTime = 0;
        entries.forEach(entry => {
            totalTime += entry.duration;
        });
        
        alert(`Today's Statistics:\n\nEntries: ${entries.length}\nTotal Time: ${formatDuration(totalTime)}`);
    }
    
    _showWeekStats() {
        showNotification('Week statistics coming soon');
    }
    
    _showMonthStats() {
        showNotification('Month statistics coming soon');
    }
}