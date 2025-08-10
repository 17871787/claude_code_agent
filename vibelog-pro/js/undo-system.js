/**
 * Universal Undo System
 * Multi-level undo/redo with visual previews and persistence
 */

class UndoSystem {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        this.currentState = null;
        this.isExecutingCommand = false;
        this.observers = new Set();
        
        this._initialize();
    }
    
    _initialize() {
        this._loadPersistentHistory();
        this._captureInitialState();
        this._bindKeyboardShortcuts();
        this._setupAutoSave();
        this._createUI();
    }
    
    // ============ State Management ============
    
    _captureInitialState() {
        this.currentState = this._captureAppState();
        this._notifyObservers();
    }
    
    _captureAppState() {
        return {
            timestamp: Date.now(),
            entries: this._captureEntries(),
            settings: this._captureSettings(),
            view: app.currentView,
            timer: app.currentTimer ? { ...app.currentTimer } : null,
            boardState: this._captureBoardState(),
            changelogState: this._captureChangelogState()
        };
    }
    
    _captureEntries() {
        const entries = [];
        const dates = this._getRecentDates(7);
        
        dates.forEach(date => {
            const dayEntries = storage.get(`entries_${date}`) || [];
            if (dayEntries.length > 0) {
                entries.push({ date, entries: dayEntries });
            }
        });
        
        return entries;
    }
    
    _captureSettings() {
        return storage.get('settings') || { ...app.settings };
    }
    
    _captureBoardState() {
        // Capture board cards positions
        const boardState = {
            now: [],
            next: [],
            later: []
        };
        
        ['now', 'next', 'later'].forEach(column => {
            const cards = document.querySelectorAll(`#board-${column} .card`);
            cards.forEach(card => {
                boardState[column].push({
                    id: card.dataset.id,
                    text: card.textContent
                });
            });
        });
        
        return boardState;
    }
    
    _captureChangelogState() {
        const changelogEntry = document.getElementById('changelog-entry');
        return changelogEntry ? changelogEntry.value : '';
    }
    
    // ============ Command Execution ============
    
    execute(command) {
        if (this.isExecutingCommand) return;
        
        this.isExecutingCommand = true;
        
        try {
            // Capture state before execution
            const beforeState = this._captureAppState();
            
            // Execute the command
            const result = command.execute();
            
            // Capture state after execution
            const afterState = this._captureAppState();
            
            // Create undo action
            const undoAction = {
                id: this._generateId(),
                timestamp: Date.now(),
                description: command.description || 'Action',
                command: command,
                beforeState: beforeState,
                afterState: afterState,
                undo: () => this._restoreState(beforeState),
                redo: () => this._restoreState(afterState)
            };
            
            // Add to undo stack
            this._pushUndo(undoAction);
            
            // Clear redo stack
            this.redoStack = [];
            
            // Update current state
            this.currentState = afterState;
            
            // Notify observers
            this._notifyObservers();
            
            // Save to persistent storage
            this._savePersistentHistory();
            
            return result;
            
        } finally {
            this.isExecutingCommand = false;
        }
    }
    
    // ============ Undo/Redo Operations ============
    
    undo() {
        if (!this.canUndo()) return false;
        
        const action = this.undoStack.pop();
        
        try {
            // Restore previous state
            action.undo();
            
            // Move to redo stack
            this.redoStack.push(action);
            
            // Update current state
            this.currentState = action.beforeState;
            
            // Notify
            this._notifyObservers();
            this._showNotification(`Undone: ${action.description}`);
            
            // Save
            this._savePersistentHistory();
            
            return true;
            
        } catch (error) {
            console.error('Undo failed:', error);
            this.undoStack.push(action); // Restore stack
            return false;
        }
    }
    
    redo() {
        if (!this.canRedo()) return false;
        
        const action = this.redoStack.pop();
        
        try {
            // Restore next state
            action.redo();
            
            // Move to undo stack
            this.undoStack.push(action);
            
            // Update current state
            this.currentState = action.afterState;
            
            // Notify
            this._notifyObservers();
            this._showNotification(`Redone: ${action.description}`);
            
            // Save
            this._savePersistentHistory();
            
            return true;
            
        } catch (error) {
            console.error('Redo failed:', error);
            this.redoStack.push(action); // Restore stack
            return false;
        }
    }
    
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    // ============ State Restoration ============
    
    _restoreState(state) {
        // Restore entries
        state.entries.forEach(({ date, entries }) => {
            storage.set(`entries_${date}`, entries, true);
        });
        
        // Restore settings
        storage.set('settings', state.settings, true);
        app.settings = { ...state.settings };
        this._updateSettingsUI(state.settings);
        
        // Restore view
        if (state.view !== app.currentView) {
            this._switchView(state.view);
        }
        
        // Restore timer
        app.currentTimer = state.timer;
        this._updateTimerUI(state.timer);
        
        // Restore board state
        this._restoreBoardState(state.boardState);
        
        // Restore changelog
        this._restoreChangelogState(state.changelogState);
        
        // Refresh displays
        this._refreshDisplays();
    }
    
    _updateSettingsUI(settings) {
        document.getElementById('work-start').value = settings.workStart;
        document.getElementById('work-end').value = settings.workEnd;
        document.getElementById('ping-interval').value = settings.pingInterval;
        document.getElementById('ping-enabled').checked = settings.pingEnabled;
    }
    
    _updateTimerUI(timer) {
        const btn = document.getElementById('btn-start-timer');
        const input = document.getElementById('quick-description');
        
        if (timer) {
            btn.textContent = 'Stop';
            input.value = timer.description;
            input.disabled = true;
        } else {
            btn.textContent = 'Start';
            input.value = '';
            input.disabled = false;
        }
    }
    
    _restoreBoardState(boardState) {
        ['now', 'next', 'later'].forEach(column => {
            const container = document.getElementById(`board-${column}`);
            if (container) {
                container.innerHTML = '';
                boardState[column].forEach(card => {
                    const cardEl = document.createElement('div');
                    cardEl.className = 'card';
                    cardEl.dataset.id = card.id;
                    cardEl.textContent = card.text;
                    container.appendChild(cardEl);
                });
            }
        });
    }
    
    _restoreChangelogState(value) {
        const changelogEntry = document.getElementById('changelog-entry');
        if (changelogEntry) {
            changelogEntry.value = value;
        }
    }
    
    _refreshDisplays() {
        // Refresh entries display
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        const container = document.getElementById('today-entries');
        
        if (container) {
            container.innerHTML = '';
            entries.forEach(entry => {
                displayEntry(entry);
            });
        }
        
        // Update storage info
        if (window.updateStorageInfo) {
            updateStorageInfo();
        }
    }
    
    // ============ Visual History ============
    
    _createUI() {
        // Create history panel
        const panel = document.createElement('div');
        panel.id = 'undo-history-panel';
        panel.className = 'undo-history-panel';
        panel.innerHTML = `
            <div class="history-header">
                <h3>History</h3>
                <div class="history-controls">
                    <button id="btn-undo" class="history-btn" title="Undo (Ctrl+Z)">↶</button>
                    <button id="btn-redo" class="history-btn" title="Redo (Ctrl+Y)">↷</button>
                    <button id="btn-clear-history" class="history-btn danger" title="Clear History">🗑</button>
                </div>
            </div>
            <div class="history-timeline" id="history-timeline"></div>
            <div class="history-preview" id="history-preview"></div>
        `;
        
        document.body.appendChild(panel);
        
        // Bind UI controls
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.redo());
        document.getElementById('btn-clear-history').addEventListener('click', () => this.clearHistory());
        
        // Toggle panel with Ctrl+H
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                panel.classList.toggle('show');
                if (panel.classList.contains('show')) {
                    this._updateHistoryUI();
                }
            }
        });
    }
    
    _updateHistoryUI() {
        const timeline = document.getElementById('history-timeline');
        if (!timeline) return;
        
        let html = '';
        
        // Show undo stack (in reverse for visual clarity)
        const undoItems = [...this.undoStack].reverse();
        undoItems.forEach((action, index) => {
            const relativeTime = this._getRelativeTime(action.timestamp);
            html += `
                <div class="history-item past" data-id="${action.id}">
                    <div class="history-marker"></div>
                    <div class="history-content">
                        <div class="history-description">${action.description}</div>
                        <div class="history-time">${relativeTime}</div>
                    </div>
                </div>
            `;
        });
        
        // Current state marker
        html += `
            <div class="history-item current">
                <div class="history-marker"></div>
                <div class="history-content">
                    <div class="history-description">Current State</div>
                    <div class="history-time">Now</div>
                </div>
            </div>
        `;
        
        // Show redo stack
        this.redoStack.forEach((action, index) => {
            const relativeTime = this._getRelativeTime(action.timestamp);
            html += `
                <div class="history-item future" data-id="${action.id}">
                    <div class="history-marker"></div>
                    <div class="history-content">
                        <div class="history-description">${action.description}</div>
                        <div class="history-time">${relativeTime}</div>
                    </div>
                </div>
            `;
        });
        
        timeline.innerHTML = html;
        
        // Add hover previews
        timeline.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const actionId = item.dataset.id;
                if (actionId) {
                    this._showPreview(actionId);
                }
            });
            
            item.addEventListener('click', () => {
                const actionId = item.dataset.id;
                if (actionId) {
                    this._jumpToState(actionId);
                }
            });
        });
    }
    
    _showPreview(actionId) {
        const action = [...this.undoStack, ...this.redoStack].find(a => a.id === actionId);
        if (!action) return;
        
        const preview = document.getElementById('history-preview');
        if (!preview) return;
        
        const stateDiff = this._calculateStateDiff(action.beforeState, action.afterState);
        
        let html = '<h4>Changes</h4><ul>';
        stateDiff.forEach(diff => {
            html += `<li>${diff}</li>`;
        });
        html += '</ul>';
        
        preview.innerHTML = html;
    }
    
    _calculateStateDiff(before, after) {
        const diffs = [];
        
        // Check entries
        const beforeEntryCount = before.entries.reduce((sum, d) => sum + d.entries.length, 0);
        const afterEntryCount = after.entries.reduce((sum, d) => sum + d.entries.length, 0);
        
        if (beforeEntryCount !== afterEntryCount) {
            const diff = afterEntryCount - beforeEntryCount;
            diffs.push(`${diff > 0 ? '+' : ''}${diff} entries`);
        }
        
        // Check timer
        if (!before.timer && after.timer) {
            diffs.push(`Started timer: ${after.timer.description}`);
        } else if (before.timer && !after.timer) {
            diffs.push(`Stopped timer: ${before.timer.description}`);
        }
        
        // Check view
        if (before.view !== after.view) {
            diffs.push(`View: ${before.view} → ${after.view}`);
        }
        
        // Check settings
        const settingsChanged = JSON.stringify(before.settings) !== JSON.stringify(after.settings);
        if (settingsChanged) {
            diffs.push('Settings changed');
        }
        
        return diffs;
    }
    
    _jumpToState(actionId) {
        // Find the action
        const undoIndex = this.undoStack.findIndex(a => a.id === actionId);
        const redoIndex = this.redoStack.findIndex(a => a.id === actionId);
        
        if (undoIndex >= 0) {
            // Undo to this point
            const stepsToUndo = this.undoStack.length - undoIndex;
            for (let i = 0; i < stepsToUndo; i++) {
                this.undo();
            }
        } else if (redoIndex >= 0) {
            // Redo to this point
            const stepsToRedo = this.redoStack.length - redoIndex;
            for (let i = 0; i < stepsToRedo; i++) {
                this.redo();
            }
        }
    }
    
    // ============ Persistence ============
    
    _loadPersistentHistory() {
        try {
            const saved = localStorage.getItem('vl_undo_history');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Restore stacks with proper methods
                data.undoStack.forEach(action => {
                    this.undoStack.push(this._deserializeAction(action));
                });
                
                data.redoStack.forEach(action => {
                    this.redoStack.push(this._deserializeAction(action));
                });
            }
        } catch (error) {
            console.warn('Failed to load undo history:', error);
        }
    }
    
    _savePersistentHistory() {
        try {
            const data = {
                undoStack: this.undoStack.slice(-20).map(a => this._serializeAction(a)),
                redoStack: this.redoStack.slice(-10).map(a => this._serializeAction(a))
            };
            
            localStorage.setItem('vl_undo_history', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save undo history:', error);
        }
    }
    
    _serializeAction(action) {
        return {
            id: action.id,
            timestamp: action.timestamp,
            description: action.description,
            beforeState: action.beforeState,
            afterState: action.afterState
        };
    }
    
    _deserializeAction(data) {
        return {
            ...data,
            undo: () => this._restoreState(data.beforeState),
            redo: () => this._restoreState(data.afterState)
        };
    }
    
    _setupAutoSave() {
        // Auto-save history every 30 seconds
        setInterval(() => {
            this._savePersistentHistory();
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this._savePersistentHistory();
        });
    }
    
    // ============ Keyboard Shortcuts ============
    
    _bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.redo();
            }
        });
    }
    
    // ============ Utility Methods ============
    
    _pushUndo(action) {
        this.undoStack.push(action);
        
        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
    }
    
    clearHistory() {
        if (confirm('Clear all undo history? This cannot be undone.')) {
            this.undoStack = [];
            this.redoStack = [];
            this._savePersistentHistory();
            this._notifyObservers();
            this._showNotification('History cleared');
        }
    }
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    _getRecentDates(days) {
        const dates = [];
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }
    
    _getRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    }
    
    _switchView(viewName) {
        const btn = document.getElementById(`btn-${viewName}`);
        if (btn) btn.click();
    }
    
    _showNotification(message) {
        if (window.showNotification) {
            window.showNotification(message);
        }
    }
    
    // ============ Observer Pattern ============
    
    subscribe(callback) {
        this.observers.add(callback);
    }
    
    unsubscribe(callback) {
        this.observers.delete(callback);
    }
    
    _notifyObservers() {
        this.observers.forEach(callback => {
            callback({
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                undoCount: this.undoStack.length,
                redoCount: this.redoStack.length
            });
        });
        
        // Update UI
        this._updateHistoryUI();
        this._updateButtons();
    }
    
    _updateButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() ? 
                `Undo: ${this.undoStack[this.undoStack.length - 1].description}` : 
                'Nothing to undo';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() ? 
                `Redo: ${this.redoStack[this.redoStack.length - 1].description}` : 
                'Nothing to redo';
        }
    }
}

// Command pattern for undoable actions
class Command {
    constructor(description, executeFn, undoFn) {
        this.description = description;
        this.executeFn = executeFn;
        this.undoFn = undoFn;
    }
    
    execute() {
        return this.executeFn();
    }
    
    undo() {
        return this.undoFn();
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.undoSystem = new UndoSystem();
    });
} else {
    window.undoSystem = new UndoSystem();
}