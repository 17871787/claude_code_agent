/**
 * Contextual Hints System - Smart, non-intrusive guidance
 * Progressive UX Enhancement
 */

class ContextualHints {
    constructor() {
        this.hints = new Map();
        this.shownHints = new Set();
        this.currentHint = null;
        this.enabled = true;
        
        this._loadPreferences();
        this._initializeHints();
        this._bindEvents();
        this._startHintEngine();
    }
    
    _initializeHints() {
        // Define contextual hints
        this.hints.set('first-visit', {
            trigger: () => !localStorage.getItem('vl_visited'),
            message: 'Welcome! Press ? for keyboard shortcuts or / for commands',
            position: 'center',
            delay: 1000,
            priority: 10
        });
        
        this.hints.set('empty-timesheet', {
            trigger: () => app.currentView === 'timesheet' && document.querySelectorAll('.entry').length === 0,
            message: 'Start tracking time by typing a description and pressing Enter',
            target: '#quick-description',
            position: 'below',
            delay: 2000,
            priority: 8
        });
        
        this.hints.set('timer-running', {
            trigger: () => app.currentTimer !== null,
            message: 'Timer is running. Press Space or T to stop',
            position: 'bottom',
            delay: 5000,
            priority: 5,
            recurring: true
        });
        
        this.hints.set('many-entries', {
            trigger: () => document.querySelectorAll('.entry').length > 10,
            message: 'Use J/K to navigate entries, or / to search',
            position: 'bottom',
            delay: 3000,
            priority: 6
        });
        
        this.hints.set('export-reminder', {
            trigger: () => {
                const entries = document.querySelectorAll('.entry').length;
                const hour = new Date().getHours();
                return entries > 5 && (hour >= 16 && hour <= 18);
            },
            message: 'End of day? Press E to export your timesheet',
            position: 'bottom',
            delay: 10000,
            priority: 4
        });
        
        this.hints.set('board-wip-limit', {
            trigger: () => {
                if (app.currentView !== 'board') return false;
                const wip = document.querySelectorAll('#board-now .card').length;
                return wip >= 3;
            },
            message: 'WIP limit reached. Consider moving tasks to Next',
            target: '#board-now',
            position: 'above',
            delay: 2000,
            priority: 7
        });
        
        this.hints.set('changelog-end-of-day', {
            trigger: () => {
                const hour = new Date().getHours();
                return app.currentView === 'changelog' && hour >= 16;
            },
            message: 'Record your daily accomplishments for better retrospectives',
            target: '#changelog-entry',
            position: 'above',
            delay: 2000,
            priority: 5
        });
        
        this.hints.set('keyboard-discovery', {
            trigger: () => {
                const clickCount = parseInt(localStorage.getItem('vl_click_count') || '0');
                return clickCount > 10 && !this.shownHints.has('keyboard-discovery');
            },
            message: 'Try keyboard navigation: H for timesheet, B for board, ? for help',
            position: 'bottom',
            delay: 3000,
            priority: 7
        });
        
        this.hints.set('command-palette-discovery', {
            trigger: () => {
                const entries = document.querySelectorAll('.entry').length;
                return entries > 3 && !this.shownHints.has('command-palette-discovery');
            },
            message: 'Press / to open command palette for quick actions',
            position: 'center',
            delay: 5000,
            priority: 6
        });
        
        this.hints.set('smart-continue', {
            trigger: () => {
                const entries = this._getTodayEntries();
                const lastEntry = entries[entries.length - 1];
                if (!lastEntry) return false;
                
                const timeSinceEnd = Date.now() - lastEntry.endTime;
                return timeSinceEnd < 30 * 60 * 1000; // Within 30 minutes
            },
            message: 'Continue previous task? Press / and type the first letters',
            position: 'bottom',
            delay: 2000,
            priority: 6
        });
    }
    
    _bindEvents() {
        // Track user interactions for smart hints
        document.addEventListener('click', () => {
            const count = parseInt(localStorage.getItem('vl_click_count') || '0');
            localStorage.setItem('vl_click_count', String(count + 1));
        });
        
        // View changes
        document.addEventListener('viewchange', () => {
            this._clearCurrentHint();
            this._checkHints();
        });
        
        // Hide hints on user interaction
        document.addEventListener('keydown', () => {
            if (this.currentHint) {
                this._fadeOutHint();
            }
        });
    }
    
    _startHintEngine() {
        // Check for hints periodically
        setInterval(() => {
            if (this.enabled) {
                this._checkHints();
            }
        }, 5000);
        
        // Initial check
        setTimeout(() => this._checkHints(), 1000);
    }
    
    _checkHints() {
        if (!this.enabled || this.currentHint) return;
        
        // Find applicable hints
        const applicable = [];
        
        this.hints.forEach((hint, id) => {
            if (hint.trigger()) {
                // Check if we should show recurring hints
                if (!hint.recurring && this.shownHints.has(id)) {
                    return;
                }
                
                // Check cooldown for recurring hints
                if (hint.recurring) {
                    const lastShown = this._getLastShownTime(id);
                    const cooldown = 60000; // 1 minute cooldown
                    if (Date.now() - lastShown < cooldown) {
                        return;
                    }
                }
                
                applicable.push({ id, ...hint });
            }
        });
        
        // Sort by priority and show highest
        if (applicable.length > 0) {
            applicable.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            const hint = applicable[0];
            
            setTimeout(() => {
                this._showHint(hint);
            }, hint.delay || 0);
        }
    }
    
    _showHint(hint) {
        if (this.currentHint) return;
        
        // Create hint element
        const hintEl = document.createElement('div');
        hintEl.className = 'contextual-hint';
        hintEl.textContent = hint.message;
        
        // Position the hint
        if (hint.target) {
            const target = document.querySelector(hint.target);
            if (target) {
                this._positionRelativeTo(hintEl, target, hint.position || 'below');
            }
        } else {
            this._positionAbsolute(hintEl, hint.position || 'bottom');
        }
        
        document.body.appendChild(hintEl);
        
        // Animate in
        requestAnimationFrame(() => {
            hintEl.classList.add('show');
        });
        
        this.currentHint = { element: hintEl, id: hint.id };
        
        // Mark as shown
        this.shownHints.add(hint.id);
        this._setLastShownTime(hint.id);
        
        // Store first visit
        if (hint.id === 'first-visit') {
            localStorage.setItem('vl_visited', 'true');
        }
        
        // Auto-hide after duration
        setTimeout(() => {
            this._fadeOutHint();
        }, hint.duration || 5000);
    }
    
    _positionRelativeTo(hintEl, target, position) {
        const rect = target.getBoundingClientRect();
        
        // Temporarily add to get dimensions
        hintEl.style.visibility = 'hidden';
        document.body.appendChild(hintEl);
        const hintRect = hintEl.getBoundingClientRect();
        document.body.removeChild(hintEl);
        hintEl.style.visibility = '';
        
        let top, left;
        
        switch (position) {
            case 'above':
                top = rect.top - hintRect.height - 10;
                left = rect.left + (rect.width - hintRect.width) / 2;
                break;
            case 'below':
                top = rect.bottom + 10;
                left = rect.left + (rect.width - hintRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - hintRect.height) / 2;
                left = rect.left - hintRect.width - 10;
                break;
            case 'right':
                top = rect.top + (rect.height - hintRect.height) / 2;
                left = rect.right + 10;
                break;
            default:
                top = rect.bottom + 10;
                left = rect.left;
        }
        
        // Ensure hint stays on screen
        left = Math.max(10, Math.min(left, window.innerWidth - hintRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - hintRect.height - 10));
        
        hintEl.style.top = `${top}px`;
        hintEl.style.left = `${left}px`;
    }
    
    _positionAbsolute(hintEl, position) {
        switch (position) {
            case 'center':
                hintEl.style.top = '50%';
                hintEl.style.left = '50%';
                hintEl.style.transform = 'translate(-50%, -50%)';
                break;
            case 'top':
                hintEl.style.top = '2rem';
                hintEl.style.left = '50%';
                hintEl.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                hintEl.style.bottom = '4rem';
                hintEl.style.left = '50%';
                hintEl.style.transform = 'translateX(-50%)';
                break;
        }
    }
    
    _fadeOutHint() {
        if (!this.currentHint) return;
        
        this.currentHint.element.classList.remove('show');
        
        setTimeout(() => {
            if (this.currentHint && this.currentHint.element.parentNode) {
                this.currentHint.element.remove();
            }
            this.currentHint = null;
        }, 300);
    }
    
    _clearCurrentHint() {
        if (this.currentHint) {
            this.currentHint.element.remove();
            this.currentHint = null;
        }
    }
    
    _getTodayEntries() {
        const today = new Date().toISOString().split('T')[0];
        return storage.get(`entries_${today}`) || [];
    }
    
    _getLastShownTime(id) {
        return parseInt(localStorage.getItem(`vl_hint_${id}`) || '0');
    }
    
    _setLastShownTime(id) {
        localStorage.setItem(`vl_hint_${id}`, String(Date.now()));
    }
    
    _loadPreferences() {
        this.enabled = localStorage.getItem('vl_hints_enabled') !== 'false';
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('vl_hints_enabled', String(this.enabled));
        
        if (!this.enabled) {
            this._clearCurrentHint();
        }
        
        return this.enabled;
    }
    
    reset() {
        // Clear shown hints to show them again
        this.shownHints.clear();
        
        // Clear localStorage hint records
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vl_hint_')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
        
        // Trigger immediate check
        this._checkHints();
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contextualHints = new ContextualHints();
    });
} else {
    window.contextualHints = new ContextualHints();
}