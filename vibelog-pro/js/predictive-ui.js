/**
 * Predictive UI Integration
 * Connects predictive engine with user interface
 */

class PredictiveUI {
    constructor() {
        this.engine = window.predictiveEngine;
        this.currentPredictions = [];
        this.selectedPrediction = -1;
        this.durationEstimate = null;
        
        this._initialize();
    }
    
    _initialize() {
        this._enhanceQuickEntry();
        this._addPredictionPanel();
        this._setupEventListeners();
        this._addDurationEstimate();
        this._enhanceCommandPalette();
    }
    
    // ============ Quick Entry Enhancement ============
    
    _enhanceQuickEntry() {
        const quickEntry = document.getElementById('quick-description');
        if (!quickEntry) return;
        
        // Create enhanced suggestions container
        const container = document.createElement('div');
        container.className = 'predictive-suggestions';
        container.style.display = 'none';
        quickEntry.parentNode.appendChild(container);
        
        // Replace or enhance existing suggestions
        let debounceTimer;
        quickEntry.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this._updatePredictions(e.target.value, container);
            }, 150);
        });
        
        // Show predictions on focus
        quickEntry.addEventListener('focus', () => {
            if (quickEntry.value.length === 0) {
                this._showInitialPredictions(container);
            }
        });
        
        // Hide on blur
        quickEntry.addEventListener('blur', () => {
            setTimeout(() => {
                container.style.display = 'none';
            }, 200);
        });
        
        // Keyboard navigation
        quickEntry.addEventListener('keydown', (e) => {
            this._handlePredictionNavigation(e, container);
        });
    }
    
    _updatePredictions(input, container) {
        const context = {
            lastEntry: this._getLastEntry(),
            currentTime: new Date(),
            currentView: app.currentView
        };
        
        // Get predictions from engine
        this.currentPredictions = this.engine.predict(input, context);
        
        if (this.currentPredictions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        // Render predictions
        this._renderPredictions(container);
        
        // Update duration estimate
        if (input.length > 2) {
            this._updateDurationEstimate(input);
        }
    }
    
    _showInitialPredictions(container) {
        const context = {
            lastEntry: this._getLastEntry(),
            currentTime: new Date(),
            currentView: app.currentView
        };
        
        this.currentPredictions = this.engine.predict('', context);
        
        if (this.currentPredictions.length > 0) {
            this._renderPredictions(container);
        }
    }
    
    _renderPredictions(container) {
        let html = '<div class="predictions-header">Predictions</div>';
        
        this.currentPredictions.slice(0, 5).forEach((pred, index) => {
            const selected = index === this.selectedPrediction ? 'selected' : '';
            const confidence = Math.round(pred.confidence * 100);
            const duration = pred.duration ? this._formatDuration(pred.duration) : '';
            
            html += `
                <div class="prediction-item ${selected}" data-index="${index}">
                    <div class="prediction-main">
                        <span class="prediction-text">${this._highlightText(pred.description)}</span>
                        <span class="prediction-confidence">${confidence}%</span>
                    </div>
                    <div class="prediction-meta">
                        <span class="prediction-source">${pred.source}</span>
                        ${duration ? `<span class="prediction-duration">${duration}</span>` : ''}
                        <span class="prediction-reason">${pred.reason}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.prediction-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this._selectPrediction(index);
            });
            
            item.addEventListener('mouseenter', () => {
                this.selectedPrediction = index;
                this._updatePredictionSelection(container);
            });
        });
    }
    
    _handlePredictionNavigation(e, container) {
        if (container.style.display === 'none' || this.currentPredictions.length === 0) {
            return;
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedPrediction = Math.min(
                    this.selectedPrediction + 1,
                    Math.min(4, this.currentPredictions.length - 1)
                );
                this._updatePredictionSelection(container);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedPrediction = Math.max(this.selectedPrediction - 1, -1);
                this._updatePredictionSelection(container);
                break;
                
            case 'Tab':
                if (this.selectedPrediction >= 0) {
                    e.preventDefault();
                    this._selectPrediction(this.selectedPrediction);
                }
                break;
                
            case 'Enter':
                if (e.ctrlKey && this.selectedPrediction >= 0) {
                    e.preventDefault();
                    this._selectPrediction(this.selectedPrediction);
                }
                break;
        }
    }
    
    _updatePredictionSelection(container) {
        container.querySelectorAll('.prediction-item').forEach((item, index) => {
            if (index === this.selectedPrediction) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    _selectPrediction(index) {
        const prediction = this.currentPredictions[index];
        if (prediction) {
            const input = document.getElementById('quick-description');
            input.value = prediction.description;
            input.focus();
            
            // Update duration estimate
            this._updateDurationEstimate(prediction.description);
            
            // Trigger input event for other listeners
            input.dispatchEvent(new Event('input'));
            
            // Hide predictions
            document.querySelector('.predictive-suggestions').style.display = 'none';
            
            // Log selection for learning
            this._logPredictionSelection(prediction);
        }
    }
    
    // ============ Prediction Panel ============
    
    _addPredictionPanel() {
        // Create floating panel for detailed predictions
        const panel = document.createElement('div');
        panel.id = 'prediction-panel';
        panel.className = 'prediction-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Smart Predictions</h3>
                <button class="panel-close">&times;</button>
            </div>
            <div class="panel-content">
                <div class="prediction-section">
                    <h4>Next Tasks</h4>
                    <div id="next-tasks" class="task-list"></div>
                </div>
                <div class="prediction-section">
                    <h4>Time Patterns</h4>
                    <div id="time-patterns" class="pattern-list"></div>
                </div>
                <div class="prediction-section">
                    <h4>Project Suggestions</h4>
                    <div id="project-suggestions" class="project-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Close button
        panel.querySelector('.panel-close').addEventListener('click', () => {
            panel.classList.remove('show');
        });
        
        // Update panel periodically
        setInterval(() => {
            if (panel.classList.contains('show')) {
                this._updatePredictionPanel();
            }
        }, 30000); // Every 30 seconds
    }
    
    _updatePredictionPanel() {
        const context = {
            lastEntry: this._getLastEntry(),
            currentTime: new Date(),
            currentView: app.currentView
        };
        
        const predictions = this.engine.predict('', context);
        
        // Update next tasks
        const nextTasks = predictions.filter(p => p.source === 'markov').slice(0, 3);
        const nextTasksEl = document.getElementById('next-tasks');
        nextTasksEl.innerHTML = nextTasks.map(task => `
            <div class="task-item" data-task="${task.description}">
                <span>${task.description}</span>
                <span class="confidence">${Math.round(task.confidence * 100)}%</span>
            </div>
        `).join('');
        
        // Update time patterns
        const timePatterns = predictions.filter(p => p.source === 'time').slice(0, 3);
        const timePatternsEl = document.getElementById('time-patterns');
        timePatternsEl.innerHTML = timePatterns.map(pattern => `
            <div class="pattern-item">
                <span>${pattern.description}</span>
                <span class="reason">${pattern.reason}</span>
            </div>
        `).join('');
        
        // Update project suggestions
        const projectSuggestions = predictions.filter(p => p.source === 'project').slice(0, 3);
        const projectEl = document.getElementById('project-suggestions');
        projectEl.innerHTML = projectSuggestions.length > 0 ? 
            projectSuggestions.map(proj => `
                <div class="project-item">
                    <span>${proj.description}</span>
                    <span class="project-name">${proj.reason}</span>
                </div>
            `).join('') : '<div class="empty-state">No active projects detected</div>';
        
        // Add click handlers
        nextTasksEl.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('quick-description').value = item.dataset.task;
                document.getElementById('prediction-panel').classList.remove('show');
            });
        });
    }
    
    // ============ Duration Estimate ============
    
    _addDurationEstimate() {
        const quickEntry = document.querySelector('.quick-entry');
        if (!quickEntry) return;
        
        // Add duration estimate display
        const estimateEl = document.createElement('div');
        estimateEl.id = 'duration-estimate';
        estimateEl.className = 'duration-estimate';
        estimateEl.style.display = 'none';
        quickEntry.appendChild(estimateEl);
    }
    
    _updateDurationEstimate(description) {
        const estimate = this.engine.estimateDuration(description);
        const estimateEl = document.getElementById('duration-estimate');
        
        if (!estimateEl || !estimate || estimate.confidence < 0.3) {
            if (estimateEl) estimateEl.style.display = 'none';
            return;
        }
        
        const duration = this._formatDuration(estimate.estimate);
        const confidence = Math.round(estimate.confidence * 100);
        const range = estimate.range ? 
            `${this._formatDuration(estimate.range.min)} - ${this._formatDuration(estimate.range.max)}` : '';
        
        let html = `
            <div class="estimate-main">
                <span class="estimate-icon">⏱</span>
                <span class="estimate-value">${duration}</span>
                <span class="estimate-confidence">(${confidence}% confident)</span>
            </div>
        `;
        
        if (range && !estimate.default) {
            html += `<div class="estimate-range">Usually ${range}</div>`;
        }
        
        if (estimate.similar) {
            html += `<div class="estimate-note">Based on similar tasks</div>`;
        } else if (estimate.default) {
            html += `<div class="estimate-note">General estimate</div>`;
        } else if (estimate.samples) {
            html += `<div class="estimate-note">Based on ${estimate.samples} samples</div>`;
        }
        
        estimateEl.innerHTML = html;
        estimateEl.style.display = 'block';
        
        // Store for timer start
        this.durationEstimate = estimate.estimate;
    }
    
    // ============ Command Palette Enhancement ============
    
    _enhanceCommandPalette() {
        // Add predictive commands to palette
        if (window.commandPalette) {
            const originalOpen = window.commandPalette.open.bind(window.commandPalette);
            
            window.commandPalette.open = function() {
                // Add dynamic predictions as commands
                const predictions = window.predictiveEngine.predict('', {
                    lastEntry: window.predictiveUI._getLastEntry(),
                    currentTime: new Date()
                });
                
                // Add top predictions as quick commands
                predictions.slice(0, 5).forEach((pred, index) => {
                    this.commands.unshift({
                        id: `prediction-${index}`,
                        label: `Quick: ${pred.description}`,
                        action: () => {
                            document.getElementById('quick-description').value = pred.description;
                            document.getElementById('btn-start-timer').click();
                        },
                        category: 'Predictions'
                    });
                });
                
                originalOpen();
            };
        }
    }
    
    // ============ Event Listeners ============
    
    _setupEventListeners() {
        // Track entry completion for learning
        const originalStopTimer = window.stopTimer;
        window.stopTimer = function() {
            const result = originalStopTimer.apply(this, arguments);
            
            if (app.currentTimer) {
                const event = new CustomEvent('entry-completed', {
                    detail: {
                        description: app.currentTimer.description,
                        startTime: app.currentTimer.startTime,
                        duration: Date.now() - app.currentTimer.startTime
                    }
                });
                window.dispatchEvent(event);
            }
            
            return result;
        };
        
        // Show/hide prediction panel shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                const panel = document.getElementById('prediction-panel');
                panel.classList.toggle('show');
                if (panel.classList.contains('show')) {
                    this._updatePredictionPanel();
                }
            }
        });
        
        // Update predictions on view change
        document.addEventListener('viewchange', () => {
            setTimeout(() => {
                const container = document.querySelector('.predictive-suggestions');
                if (container) {
                    this._showInitialPredictions(container);
                }
            }, 100);
        });
    }
    
    // ============ Utility Methods ============
    
    _getLastEntry() {
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        return entries[entries.length - 1];
    }
    
    _formatDuration(ms) {
        const minutes = Math.round(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${minutes}m`;
    }
    
    _highlightText(text) {
        const input = document.getElementById('quick-description').value.toLowerCase();
        if (!input) return text;
        
        const index = text.toLowerCase().indexOf(input);
        if (index === -1) return text;
        
        return text.substring(0, index) + 
               `<mark>${text.substring(index, index + input.length)}</mark>` + 
               text.substring(index + input.length);
    }
    
    _logPredictionSelection(prediction) {
        // Log for analytics and learning
        const log = {
            timestamp: Date.now(),
            prediction: prediction.description,
            confidence: prediction.confidence,
            source: prediction.source,
            accepted: true
        };
        
        // Store in localStorage for analysis
        const logs = JSON.parse(localStorage.getItem('vl_prediction_logs') || '[]');
        logs.push(log);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('vl_prediction_logs', JSON.stringify(logs));
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for predictive engine to initialize
        setTimeout(() => {
            window.predictiveUI = new PredictiveUI();
        }, 500);
    });
} else {
    setTimeout(() => {
        window.predictiveUI = new PredictiveUI();
    }, 500);
}