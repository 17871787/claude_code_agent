/**
 * Predictive Suggestions Engine
 * Advanced pattern analysis and prediction system
 */

class PredictiveEngine {
    constructor() {
        this.patterns = new Map();
        this.sequences = [];
        this.markovChain = new Map();
        this.timePatterns = new Map();
        this.projectPatterns = new Map();
        this.durationEstimates = new Map();
        
        this.minConfidence = 0.3;
        this.learningRate = 0.1;
        this.decayFactor = 0.95;
        
        this._initialize();
    }
    
    _initialize() {
        this._loadHistoricalData();
        this._buildPatterns();
        this._trainMarkovChain();
        this._analyzeTimePatterns();
        this._detectProjects();
        this._startRealTimeLearning();
    }
    
    // ============ Data Loading ============
    
    _loadHistoricalData() {
        const entries = [];
        const days = 30; // Analyze last 30 days
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayEntries = storage.get(`entries_${dateStr}`) || [];
            entries.push(...dayEntries);
        }
        
        this.historicalData = entries.sort((a, b) => a.startTime - b.startTime);
        
        // Build sequences
        this.sequences = this._buildSequences(this.historicalData);
    }
    
    _buildSequences(entries) {
        const sequences = [];
        let currentSequence = [];
        let lastEndTime = 0;
        
        entries.forEach(entry => {
            // If more than 1 hour gap, start new sequence
            if (lastEndTime && entry.startTime - lastEndTime > 3600000) {
                if (currentSequence.length > 0) {
                    sequences.push(currentSequence);
                    currentSequence = [];
                }
            }
            
            currentSequence.push({
                description: entry.description.toLowerCase(),
                duration: entry.duration,
                time: new Date(entry.startTime).getHours(),
                day: new Date(entry.startTime).getDay(),
                date: new Date(entry.startTime).toISOString().split('T')[0]
            });
            
            lastEndTime = entry.endTime || entry.startTime + entry.duration;
        });
        
        if (currentSequence.length > 0) {
            sequences.push(currentSequence);
        }
        
        return sequences;
    }
    
    // ============ Pattern Analysis ============
    
    _buildPatterns() {
        // Frequency patterns
        const frequencyMap = new Map();
        
        this.historicalData.forEach(entry => {
            const key = entry.description.toLowerCase();
            if (!frequencyMap.has(key)) {
                frequencyMap.set(key, {
                    count: 0,
                    durations: [],
                    times: [],
                    days: [],
                    lastSeen: 0
                });
            }
            
            const pattern = frequencyMap.get(key);
            pattern.count++;
            pattern.durations.push(entry.duration);
            pattern.times.push(new Date(entry.startTime).getHours());
            pattern.days.push(new Date(entry.startTime).getDay());
            pattern.lastSeen = Math.max(pattern.lastSeen, entry.startTime);
        });
        
        // Calculate statistics for each pattern
        frequencyMap.forEach((pattern, key) => {
            this.patterns.set(key, {
                description: key,
                frequency: pattern.count / this.sequences.length,
                avgDuration: this._average(pattern.durations),
                stdDuration: this._standardDeviation(pattern.durations),
                preferredTimes: this._findPreferredTimes(pattern.times),
                preferredDays: this._findPreferredDays(pattern.days),
                recency: this._calculateRecency(pattern.lastSeen),
                confidence: this._calculatePatternConfidence(pattern)
            });
        });
    }
    
    _trainMarkovChain() {
        // Build transition probabilities
        this.sequences.forEach(sequence => {
            for (let i = 0; i < sequence.length - 1; i++) {
                const current = sequence[i].description;
                const next = sequence[i + 1].description;
                
                if (!this.markovChain.has(current)) {
                    this.markovChain.set(current, new Map());
                }
                
                const transitions = this.markovChain.get(current);
                transitions.set(next, (transitions.get(next) || 0) + 1);
            }
        });
        
        // Normalize to probabilities
        this.markovChain.forEach(transitions => {
            const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
            transitions.forEach((count, next) => {
                transitions.set(next, count / total);
            });
        });
    }
    
    _analyzeTimePatterns() {
        // Analyze patterns by time of day
        const timeSlots = new Array(24).fill(null).map(() => []);
        
        this.historicalData.forEach(entry => {
            const hour = new Date(entry.startTime).getHours();
            timeSlots[hour].push(entry.description.toLowerCase());
        });
        
        // Find common tasks for each hour
        timeSlots.forEach((tasks, hour) => {
            if (tasks.length > 0) {
                const frequency = this._countFrequency(tasks);
                const topTasks = this._getTopItems(frequency, 3);
                
                this.timePatterns.set(hour, {
                    tasks: topTasks,
                    confidence: Math.min(1, tasks.length / 10) // Confidence based on sample size
                });
            }
        });
        
        // Day of week patterns
        this.dayPatterns = new Map();
        for (let day = 0; day < 7; day++) {
            const dayTasks = this.historicalData
                .filter(e => new Date(e.startTime).getDay() === day)
                .map(e => e.description.toLowerCase());
            
            if (dayTasks.length > 0) {
                const frequency = this._countFrequency(dayTasks);
                const topTasks = this._getTopItems(frequency, 5);
                
                this.dayPatterns.set(day, {
                    tasks: topTasks,
                    confidence: Math.min(1, dayTasks.length / 20)
                });
            }
        }
    }
    
    _detectProjects() {
        // Detect project patterns using clustering
        const descriptions = this.historicalData.map(e => e.description.toLowerCase());
        const words = new Set();
        
        // Extract all words
        descriptions.forEach(desc => {
            desc.split(/\s+/).forEach(word => {
                if (word.length > 3) { // Ignore short words
                    words.add(word);
                }
            });
        });
        
        // Find co-occurring words (potential project names)
        const coOccurrence = new Map();
        
        words.forEach(word1 => {
            words.forEach(word2 => {
                if (word1 !== word2) {
                    const pair = [word1, word2].sort().join('|');
                    
                    const count = descriptions.filter(desc => 
                        desc.includes(word1) && desc.includes(word2)
                    ).length;
                    
                    if (count > 2) { // Minimum threshold
                        coOccurrence.set(pair, count);
                    }
                }
            });
        });
        
        // Identify project clusters
        const projects = new Map();
        
        descriptions.forEach(desc => {
            // Simple project detection - look for common prefixes
            const match = desc.match(/^(\w+[-_]?\w*)/);
            if (match) {
                const project = match[1];
                if (!projects.has(project)) {
                    projects.set(project, {
                        name: project,
                        tasks: [],
                        totalTime: 0,
                        frequency: 0
                    });
                }
                
                const proj = projects.get(project);
                proj.tasks.push(desc);
                proj.frequency++;
                
                const entry = this.historicalData.find(e => 
                    e.description.toLowerCase() === desc
                );
                if (entry) {
                    proj.totalTime += entry.duration;
                }
            }
        });
        
        // Filter and store significant projects
        projects.forEach((project, name) => {
            if (project.frequency > 3) {
                this.projectPatterns.set(name, {
                    ...project,
                    avgTime: project.totalTime / project.frequency,
                    confidence: Math.min(1, project.frequency / 10)
                });
            }
        });
    }
    
    // ============ Prediction Methods ============
    
    predict(currentInput = '', context = {}) {
        const predictions = [];
        
        // 1. Markov chain predictions
        if (context.lastEntry) {
            const markovPredictions = this._predictNextTask(context.lastEntry);
            predictions.push(...markovPredictions);
        }
        
        // 2. Time-based predictions
        const timePredictions = this._predictByTime();
        predictions.push(...timePredictions);
        
        // 3. Day-based predictions
        const dayPredictions = this._predictByDay();
        predictions.push(...dayPredictions);
        
        // 4. Project-based predictions
        if (currentInput) {
            const projectPredictions = this._predictByProject(currentInput);
            predictions.push(...projectPredictions);
        }
        
        // 5. Frequency-based predictions
        const frequencyPredictions = this._predictByFrequency(currentInput);
        predictions.push(...frequencyPredictions);
        
        // Merge and rank predictions
        return this._rankPredictions(predictions, currentInput);
    }
    
    _predictNextTask(lastTask) {
        const predictions = [];
        const lastDesc = lastTask.description.toLowerCase();
        
        if (this.markovChain.has(lastDesc)) {
            const transitions = this.markovChain.get(lastDesc);
            
            transitions.forEach((probability, nextTask) => {
                if (probability > this.minConfidence) {
                    predictions.push({
                        description: nextTask,
                        confidence: probability,
                        source: 'markov',
                        reason: `Often follows "${lastTask.description}"`
                    });
                }
            });
        }
        
        return predictions;
    }
    
    _predictByTime() {
        const predictions = [];
        const currentHour = new Date().getHours();
        
        // Check exact hour
        if (this.timePatterns.has(currentHour)) {
            const pattern = this.timePatterns.get(currentHour);
            pattern.tasks.forEach((task, index) => {
                predictions.push({
                    description: task.item,
                    confidence: pattern.confidence * (1 - index * 0.2), // Decay by rank
                    source: 'time',
                    reason: `Common at ${currentHour}:00`
                });
            });
        }
        
        // Check adjacent hours
        [-1, 1].forEach(offset => {
            const hour = (currentHour + offset + 24) % 24;
            if (this.timePatterns.has(hour)) {
                const pattern = this.timePatterns.get(hour);
                pattern.tasks.forEach((task, index) => {
                    predictions.push({
                        description: task.item,
                        confidence: pattern.confidence * 0.5 * (1 - index * 0.2),
                        source: 'time',
                        reason: `Common around this time`
                    });
                });
            }
        });
        
        return predictions;
    }
    
    _predictByDay() {
        const predictions = [];
        const currentDay = new Date().getDay();
        
        if (this.dayPatterns && this.dayPatterns.has(currentDay)) {
            const pattern = this.dayPatterns.get(currentDay);
            pattern.tasks.forEach((task, index) => {
                predictions.push({
                    description: task.item,
                    confidence: pattern.confidence * (1 - index * 0.15),
                    source: 'day',
                    reason: `Common on ${this._getDayName(currentDay)}s`
                });
            });
        }
        
        return predictions;
    }
    
    _predictByProject(input) {
        const predictions = [];
        const inputLower = input.toLowerCase();
        
        this.projectPatterns.forEach((project, name) => {
            if (name.includes(inputLower) || inputLower.includes(name)) {
                // Suggest common tasks from this project
                const uniqueTasks = [...new Set(project.tasks)];
                uniqueTasks.slice(0, 3).forEach((task, index) => {
                    predictions.push({
                        description: task,
                        confidence: project.confidence * (1 - index * 0.2),
                        source: 'project',
                        reason: `Part of ${name} project`
                    });
                });
            }
        });
        
        return predictions;
    }
    
    _predictByFrequency(input) {
        const predictions = [];
        const inputLower = input.toLowerCase();
        
        // Get all patterns sorted by frequency
        const sortedPatterns = Array.from(this.patterns.entries())
            .sort((a, b) => b[1].frequency - a[1].frequency);
        
        sortedPatterns.forEach(([key, pattern]) => {
            // Check if pattern matches input
            let matchScore = 0;
            
            if (inputLower && key.includes(inputLower)) {
                matchScore = inputLower.length / key.length;
            } else if (inputLower && inputLower.includes(key)) {
                matchScore = key.length / inputLower.length * 0.5;
            } else if (!inputLower && pattern.frequency > 0.1) {
                matchScore = pattern.frequency * 0.3;
            }
            
            if (matchScore > 0) {
                predictions.push({
                    description: key,
                    confidence: pattern.confidence * matchScore * pattern.recency,
                    source: 'frequency',
                    reason: `Used ${pattern.count || Math.round(pattern.frequency * 100)} times`,
                    duration: pattern.avgDuration
                });
            }
        });
        
        return predictions.slice(0, 10);
    }
    
    // ============ Duration Estimation ============
    
    estimateDuration(description) {
        const descLower = description.toLowerCase();
        
        // Check if we have exact match
        if (this.patterns.has(descLower)) {
            const pattern = this.patterns.get(descLower);
            return {
                estimate: pattern.avgDuration,
                confidence: pattern.confidence,
                range: {
                    min: Math.max(0, pattern.avgDuration - pattern.stdDuration),
                    max: pattern.avgDuration + pattern.stdDuration
                },
                samples: pattern.count
            };
        }
        
        // Try to find similar tasks
        let bestMatch = null;
        let bestScore = 0;
        
        this.patterns.forEach((pattern, key) => {
            const similarity = this._calculateSimilarity(descLower, key);
            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = pattern;
            }
        });
        
        if (bestMatch && bestScore > 0.5) {
            return {
                estimate: bestMatch.avgDuration,
                confidence: bestMatch.confidence * bestScore,
                range: {
                    min: Math.max(0, bestMatch.avgDuration - bestMatch.stdDuration),
                    max: bestMatch.avgDuration + bestMatch.stdDuration
                },
                samples: bestMatch.count,
                similar: true
            };
        }
        
        // Default estimate based on all tasks
        const allDurations = this.historicalData.map(e => e.duration);
        const avgDuration = this._average(allDurations);
        const stdDuration = this._standardDeviation(allDurations);
        
        return {
            estimate: avgDuration,
            confidence: 0.3,
            range: {
                min: Math.max(0, avgDuration - stdDuration),
                max: avgDuration + stdDuration
            },
            samples: allDurations.length,
            default: true
        };
    }
    
    // ============ Learning Methods ============
    
    _startRealTimeLearning() {
        // Listen for new entries
        window.addEventListener('entry-completed', (e) => {
            this._learnFromEntry(e.detail);
        });
        
        // Periodic pattern refresh
        setInterval(() => {
            this._refreshPatterns();
        }, 300000); // Every 5 minutes
    }
    
    _learnFromEntry(entry) {
        const descLower = entry.description.toLowerCase();
        
        // Update patterns
        if (this.patterns.has(descLower)) {
            const pattern = this.patterns.get(descLower);
            
            // Update with exponential moving average
            pattern.frequency = pattern.frequency * (1 - this.learningRate) + this.learningRate;
            pattern.avgDuration = pattern.avgDuration * (1 - this.learningRate) + 
                                 entry.duration * this.learningRate;
            pattern.recency = 1; // Reset recency
            pattern.confidence = Math.min(1, pattern.confidence + 0.05);
            
            // Update time preferences
            const hour = new Date(entry.startTime).getHours();
            if (!pattern.preferredTimes.includes(hour)) {
                pattern.preferredTimes.push(hour);
            }
        } else {
            // New pattern
            this.patterns.set(descLower, {
                description: descLower,
                frequency: this.learningRate,
                avgDuration: entry.duration,
                stdDuration: 0,
                preferredTimes: [new Date(entry.startTime).getHours()],
                preferredDays: [new Date(entry.startTime).getDay()],
                recency: 1,
                confidence: 0.3,
                count: 1
            });
        }
        
        // Update Markov chain
        const lastEntry = this._getLastEntry();
        if (lastEntry && lastEntry.description !== entry.description) {
            const lastDesc = lastEntry.description.toLowerCase();
            
            if (!this.markovChain.has(lastDesc)) {
                this.markovChain.set(lastDesc, new Map());
            }
            
            const transitions = this.markovChain.get(lastDesc);
            const currentCount = transitions.get(descLower) || 0;
            transitions.set(descLower, currentCount * (1 - this.learningRate) + this.learningRate);
        }
    }
    
    _refreshPatterns() {
        // Apply decay to recency
        this.patterns.forEach(pattern => {
            pattern.recency *= this.decayFactor;
        });
        
        // Decay low-confidence patterns
        this.patterns.forEach((pattern, key) => {
            if (pattern.confidence < this.minConfidence && pattern.recency < 0.1) {
                this.patterns.delete(key);
            }
        });
    }
    
    // ============ Utility Methods ============
    
    _rankPredictions(predictions, input) {
        // Remove duplicates
        const unique = new Map();
        
        predictions.forEach(pred => {
            const key = pred.description;
            if (!unique.has(key) || unique.get(key).confidence < pred.confidence) {
                unique.set(key, pred);
            }
        });
        
        // Convert to array and sort
        let ranked = Array.from(unique.values());
        
        // Apply input matching boost
        if (input) {
            const inputLower = input.toLowerCase();
            ranked.forEach(pred => {
                if (pred.description.startsWith(inputLower)) {
                    pred.confidence *= 1.5;
                } else if (pred.description.includes(inputLower)) {
                    pred.confidence *= 1.2;
                }
            });
        }
        
        // Sort by confidence
        ranked.sort((a, b) => b.confidence - a.confidence);
        
        // Return top predictions above threshold
        return ranked.filter(p => p.confidence > this.minConfidence).slice(0, 10);
    }
    
    _calculateSimilarity(str1, str2) {
        // Levenshtein distance normalized
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1;
        
        const distance = this._levenshteinDistance(str1, str2);
        return 1 - (distance / maxLen);
    }
    
    _levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    _calculatePatternConfidence(pattern) {
        let confidence = 0;
        
        // Factor 1: Frequency (40%)
        confidence += Math.min(1, pattern.count / 20) * 0.4;
        
        // Factor 2: Consistency (30%)
        const consistency = pattern.durations.length > 1 ? 
            1 - (this._standardDeviation(pattern.durations) / this._average(pattern.durations)) : 0.5;
        confidence += Math.max(0, consistency) * 0.3;
        
        // Factor 3: Recency (30%)
        const daysSinceLastSeen = (Date.now() - pattern.lastSeen) / (1000 * 60 * 60 * 24);
        const recency = Math.max(0, 1 - daysSinceLastSeen / 30);
        confidence += recency * 0.3;
        
        return Math.min(1, confidence);
    }
    
    _calculateRecency(lastSeen) {
        const daysSince = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - daysSince / 30);
    }
    
    _findPreferredTimes(times) {
        const frequency = this._countFrequency(times);
        return this._getTopItems(frequency, 3).map(t => t.item);
    }
    
    _findPreferredDays(days) {
        const frequency = this._countFrequency(days);
        return this._getTopItems(frequency, 2).map(d => d.item);
    }
    
    _countFrequency(items) {
        const frequency = new Map();
        items.forEach(item => {
            frequency.set(item, (frequency.get(item) || 0) + 1);
        });
        return frequency;
    }
    
    _getTopItems(frequencyMap, n) {
        return Array.from(frequencyMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([item, count]) => ({ item, count }));
    }
    
    _average(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    
    _standardDeviation(numbers) {
        if (numbers.length < 2) return 0;
        const avg = this._average(numbers);
        const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
        return Math.sqrt(this._average(squaredDiffs));
    }
    
    _getLastEntry() {
        const today = new Date().toISOString().split('T')[0];
        const entries = storage.get(`entries_${today}`) || [];
        return entries[entries.length - 1];
    }
    
    _getDayName(day) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.predictiveEngine = new PredictiveEngine();
    });
} else {
    window.predictiveEngine = new PredictiveEngine();
}