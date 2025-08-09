/**
 * Keyboard Navigation System - Progressive UX Enhancement
 * Vim-style shortcuts and keyboard-first interaction
 */

class KeyboardNav {
    constructor() {
        this.mode = 'normal'; // normal, insert, command
        this.commandBuffer = '';
        this.shortcuts = new Map();
        this.lastAction = null;
        this.repeatCount = '';
        
        this._initializeShortcuts();
        this._bindEvents();
        this._showInitialHint();
    }
    
    _initializeShortcuts() {
        // Navigation shortcuts
        this.shortcuts.set('h', () => this._switchView('timesheet'));
        this.shortcuts.set('b', () => this._switchView('board'));
        this.shortcuts.set('c', () => this._switchView('changelog'));
        this.shortcuts.set('s', () => this._switchView('settings'));
        
        // Timesheet shortcuts
        this.shortcuts.set('n', () => this._newEntry());
        this.shortcuts.set('t', () => this._toggleTimer());
        this.shortcuts.set('space', () => this._toggleTimer());
        
        // Quick actions
        this.shortcuts.set('/', () => this._openCommandPalette());
        this.shortcuts.set('?', () => this._showHelp());
        this.shortcuts.set('e', () => this._exportData());
        this.shortcuts.set('u', () => this._undo());
        this.shortcuts.set('r', () => this._redo());
        
        // Vim-style movement
        this.shortcuts.set('j', () => this._moveDown());
        this.shortcuts.set('k', () => this._moveUp());
        this.shortcuts.set('g', () => this._handleG());
        this.shortcuts.set('G', () => this._moveToEnd());
        
        // Mode switching
        this.shortcuts.set('i', () => this._enterInsertMode());
        this.shortcuts.set('a', () => this._appendMode());
        this.shortcuts.set('Escape', () => this._enterNormalMode());
        
        // Board shortcuts
        this.shortcuts.set('1', () => this._moveToColumn('now'));
        this.shortcuts.set('2', () => this._moveToColumn('next'));
        this.shortcuts.set('3', () => this._moveToColumn('later'));
        
        // Delete/Edit
        this.shortcuts.set('d', () => this._deleteEntry());
        this.shortcuts.set('x', () => this._deleteEntry());
        this.shortcuts.set('o', () => this._openNewLine());
    }
    
    _bindEvents() {
        document.addEventListener('keydown', (e) => this._handleKeydown(e));
        document.addEventListener('keyup', (e) => this._handleKeyup(e));
        
        // Focus management
        document.addEventListener('focusin', (e) => this._handleFocusIn(e));
        document.addEventListener('focusout', (e) => this._handleFocusOut(e));
    }
    
    _handleKeydown(e) {
        // Don't interfere with input fields unless in normal mode
        const activeElement = document.activeElement;
        const isInputField = activeElement.tagName === 'INPUT' || 
                            activeElement.tagName === 'TEXTAREA' ||
                            activeElement.tagName === 'SELECT';
        
        // Handle Escape specially - always works
        if (e.key === 'Escape') {
            if (isInputField) {
                activeElement.blur();
            }
            this._enterNormalMode();
            e.preventDefault();
            return;
        }
        
        // In insert mode or focused on input, let default behavior happen
        if (this.mode === 'insert' || (isInputField && this.mode !== 'normal')) {
            return;
        }
        
        // Handle number prefix for repeat counts
        if (this.mode === 'normal' && e.key >= '0' && e.key <= '9' && this.repeatCount.length < 3) {
            if (!(this.repeatCount === '' && e.key === '0')) { // Ignore leading zeros
                this.repeatCount += e.key;
                this._showRepeatCount();
                e.preventDefault();
                return;
            }
        }
        
        // Check for shortcuts
        const key = this._normalizeKey(e);
        if (this.shortcuts.has(key)) {
            e.preventDefault();
            
            // Execute with repeat count
            const count = parseInt(this.repeatCount) || 1;
            this.repeatCount = '';
            
            for (let i = 0; i < count; i++) {
                this.shortcuts.get(key)();
            }
            
            this.lastAction = key;
            this._hideRepeatCount();
        }
        
        // Handle two-key combinations
        if (this.commandBuffer) {
            this._handleCommandBuffer(e.key);
            e.preventDefault();
        }
    }
    
    _handleKeyup(e) {
        // Clear any pending states if needed
    }
    
    _normalizeKey(e) {
        if (e.ctrlKey && e.key.length === 1) {
            return `Ctrl+${e.key.toUpperCase()}`;
        }
        if (e.altKey && e.key.length === 1) {
            return `Alt+${e.key.toUpperCase()}`;
        }
        if (e.metaKey && e.key.length === 1) {
            return `Cmd+${e.key.toUpperCase()}`;
        }
        return e.key;
    }
    
    _handleG() {
        if (this.commandBuffer === 'g') {
            // gg - go to start
            this._moveToStart();
            this.commandBuffer = '';
        } else {
            this.commandBuffer = 'g';
            setTimeout(() => {
                if (this.commandBuffer === 'g') {
                    this.commandBuffer = '';
                }
            }, 1000);
        }
    }
    
    _handleCommandBuffer(key) {
        const combo = this.commandBuffer + key;
        
        // Handle two-key combinations
        if (combo === 'dd') {
            this._deleteCurrentLine();
        } else if (combo === 'gg') {
            this._moveToStart();
        }
        
        this.commandBuffer = '';
    }
    
    _handleFocusIn(e) {
        const isInputField = e.target.tagName === 'INPUT' || 
                            e.target.tagName === 'TEXTAREA';
        if (isInputField) {
            this.mode = 'insert';
            this._updateModeIndicator();
        }
    }
    
    _handleFocusOut(e) {
        // Delay to check if we're focusing another input
        setTimeout(() => {
            const activeElement = document.activeElement;
            const isInputField = activeElement.tagName === 'INPUT' || 
                                activeElement.tagName === 'TEXTAREA';
            if (!isInputField) {
                this.mode = 'normal';
                this._updateModeIndicator();
            }
        }, 10);
    }
    
    // Mode Management
    _enterNormalMode() {
        this.mode = 'normal';
        document.activeElement.blur();
        this._updateModeIndicator();
        this._showHint('Normal mode - press ? for help');
    }
    
    _enterInsertMode() {
        this.mode = 'insert';
        this._focusMainInput();
        this._updateModeIndicator();
        this._showHint('Insert mode - press Esc to exit');
    }
    
    _appendMode() {
        this.mode = 'insert';
        this._focusMainInput();
        const input = document.getElementById('quick-description');
        if (input && input.value) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
        this._updateModeIndicator();
    }
    
    _updateModeIndicator() {
        let indicator = document.getElementById('mode-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'mode-indicator';
            indicator.className = 'mode-indicator';
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = this.mode.toUpperCase();
        indicator.className = `mode-indicator ${this.mode}`;
    }
    
    // Navigation Actions
    _switchView(viewName) {
        const btn = document.getElementById(`btn-${viewName}`);
        if (btn) {
            btn.click();
            this._showHint(`Switched to ${viewName}`);
        }
    }
    
    _moveDown() {
        const entries = document.querySelectorAll('.entry');
        const current = document.querySelector('.entry.selected');
        
        if (!current && entries.length > 0) {
            entries[0].classList.add('selected');
        } else if (current) {
            const index = Array.from(entries).indexOf(current);
            if (index < entries.length - 1) {
                current.classList.remove('selected');
                entries[index + 1].classList.add('selected');
                entries[index + 1].scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    _moveUp() {
        const entries = document.querySelectorAll('.entry');
        const current = document.querySelector('.entry.selected');
        
        if (!current && entries.length > 0) {
            entries[entries.length - 1].classList.add('selected');
        } else if (current) {
            const index = Array.from(entries).indexOf(current);
            if (index > 0) {
                current.classList.remove('selected');
                entries[index - 1].classList.add('selected');
                entries[index - 1].scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    _moveToStart() {
        const entries = document.querySelectorAll('.entry');
        if (entries.length > 0) {
            document.querySelectorAll('.entry.selected').forEach(e => e.classList.remove('selected'));
            entries[0].classList.add('selected');
            entries[0].scrollIntoView({ block: 'nearest' });
        }
    }
    
    _moveToEnd() {
        const entries = document.querySelectorAll('.entry');
        if (entries.length > 0) {
            document.querySelectorAll('.entry.selected').forEach(e => e.classList.remove('selected'));
            entries[entries.length - 1].classList.add('selected');
            entries[entries.length - 1].scrollIntoView({ block: 'nearest' });
        }
    }
    
    // Actions
    _newEntry() {
        this._enterInsertMode();
        document.getElementById('quick-description').value = '';
        document.getElementById('quick-description').focus();
    }
    
    _toggleTimer() {
        const btn = document.getElementById('btn-start-timer');
        if (btn) {
            btn.click();
        }
    }
    
    _focusMainInput() {
        const input = document.getElementById('quick-description');
        if (input) {
            input.focus();
        }
    }
    
    _deleteEntry() {
        const selected = document.querySelector('.entry.selected');
        if (selected) {
            if (confirm('Delete this entry?')) {
                // Would integrate with storage manager here
                selected.remove();
                this._showHint('Entry deleted');
            }
        }
    }
    
    _openNewLine() {
        this._newEntry();
    }
    
    _deleteCurrentLine() {
        this._deleteEntry();
    }
    
    _moveToColumn(column) {
        // For board view
        if (app.currentView === 'board') {
            const columnEl = document.getElementById(`board-${column}`);
            if (columnEl) {
                columnEl.focus();
                this._showHint(`Moved to ${column} column`);
            }
        }
    }
    
    _exportData() {
        // Trigger export modal or action
        if (app.currentView === 'settings') {
            document.getElementById('btn-export-csv').click();
        } else {
            this._switchView('settings');
            this._showHint('Switched to settings for export');
        }
    }
    
    _undo() {
        // Would integrate with undo system
        this._showHint('Undo not yet implemented');
    }
    
    _redo() {
        // Would integrate with undo system
        this._showHint('Redo not yet implemented');
    }
    
    _openCommandPalette() {
        if (!window.commandPalette) {
            window.commandPalette = new CommandPalette();
        }
        window.commandPalette.open();
    }
    
    _showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="help-content">
                <h2>Keyboard Shortcuts</h2>
                <div class="help-columns">
                    <div class="help-section">
                        <h3>Navigation</h3>
                        <div class="shortcut"><kbd>h</kbd> Timesheet</div>
                        <div class="shortcut"><kbd>b</kbd> Board</div>
                        <div class="shortcut"><kbd>c</kbd> Changelog</div>
                        <div class="shortcut"><kbd>s</kbd> Settings</div>
                        <div class="shortcut"><kbd>j</kbd> Move down</div>
                        <div class="shortcut"><kbd>k</kbd> Move up</div>
                        <div class="shortcut"><kbd>gg</kbd> Go to start</div>
                        <div class="shortcut"><kbd>G</kbd> Go to end</div>
                    </div>
                    <div class="help-section">
                        <h3>Actions</h3>
                        <div class="shortcut"><kbd>n</kbd> New entry</div>
                        <div class="shortcut"><kbd>t</kbd> Toggle timer</div>
                        <div class="shortcut"><kbd>Space</kbd> Toggle timer</div>
                        <div class="shortcut"><kbd>d</kbd> Delete entry</div>
                        <div class="shortcut"><kbd>e</kbd> Export data</div>
                        <div class="shortcut"><kbd>/</kbd> Command palette</div>
                        <div class="shortcut"><kbd>?</kbd> Show help</div>
                    </div>
                    <div class="help-section">
                        <h3>Modes</h3>
                        <div class="shortcut"><kbd>i</kbd> Insert mode</div>
                        <div class="shortcut"><kbd>a</kbd> Append mode</div>
                        <div class="shortcut"><kbd>Esc</kbd> Normal mode</div>
                        <div class="shortcut"><kbd>1-9</kbd> Repeat count</div>
                    </div>
                </div>
                <div class="help-footer">
                    Press <kbd>Esc</kbd> or <kbd>?</kbd> to close
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        const closeHelp = () => {
            helpModal.remove();
            document.removeEventListener('keydown', helpHandler);
        };
        
        const helpHandler = (e) => {
            if (e.key === 'Escape' || e.key === '?') {
                e.preventDefault();
                closeHelp();
            }
        };
        
        document.addEventListener('keydown', helpHandler);
        helpModal.addEventListener('click', closeHelp);
    }
    
    // UI Feedback
    _showHint(message) {
        let hint = document.getElementById('keyboard-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'keyboard-hint';
            hint.className = 'keyboard-hint';
            document.body.appendChild(hint);
        }
        
        hint.textContent = message;
        hint.classList.add('show');
        
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            hint.classList.remove('show');
        }, 2000);
    }
    
    _showInitialHint() {
        setTimeout(() => {
            this._showHint('Press ? for keyboard shortcuts');
        }, 1000);
    }
    
    _showRepeatCount() {
        let counter = document.getElementById('repeat-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'repeat-counter';
            counter.className = 'repeat-counter';
            document.body.appendChild(counter);
        }
        
        counter.textContent = this.repeatCount;
        counter.classList.add('show');
    }
    
    _hideRepeatCount() {
        const counter = document.getElementById('repeat-counter');
        if (counter) {
            counter.classList.remove('show');
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.keyboardNav = new KeyboardNav();
    });
} else {
    window.keyboardNav = new KeyboardNav();
}