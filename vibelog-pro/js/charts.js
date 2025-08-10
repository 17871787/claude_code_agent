/**
 * Data Visualization Charts
 * SVG-based charts for time tracking analytics
 */

class ChartSystem {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#2563eb',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            gray: '#6b7280'
        };
        
        this._initialize();
    }
    
    _initialize() {
        this._createChartsPanel();
        this._setupEventListeners();
        this._loadChartData();
    }
    
    // ============ UI Creation ============
    
    _createChartsPanel() {
        // Add charts view to navigation
        const nav = document.querySelector('.header nav');
        if (nav && !document.getElementById('btn-charts')) {
            const chartsBtn = document.createElement('button');
            chartsBtn.id = 'btn-charts';
            chartsBtn.className = 'nav-btn';
            chartsBtn.textContent = 'Charts';
            nav.appendChild(chartsBtn);
        }
        
        // Create charts view
        const main = document.querySelector('.main');
        if (main && !document.getElementById('view-charts')) {
            const chartsView = document.createElement('section');
            chartsView.id = 'view-charts';
            chartsView.className = 'view';
            chartsView.innerHTML = `
                <div class="container">
                    <h2>Analytics Dashboard</h2>
                    
                    <div class="chart-controls">
                        <select id="chart-period">
                            <option value="7">Last 7 days</option>
                            <option value="14">Last 14 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                        <button id="btn-refresh-charts">Refresh</button>
                    </div>
                    
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Daily Hours</h3>
                            <div id="chart-daily-hours" class="chart-container"></div>
                        </div>
                        
                        <div class="chart-card">
                            <h3>Task Distribution</h3>
                            <div id="chart-task-distribution" class="chart-container"></div>
                        </div>
                        
                        <div class="chart-card">
                            <h3>Productivity Heatmap</h3>
                            <div id="chart-heatmap" class="chart-container"></div>
                        </div>
                        
                        <div class="chart-card">
                            <h3>Time Patterns</h3>
                            <div id="chart-patterns" class="chart-container"></div>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Total Hours</div>
                            <div class="stat-value" id="stat-total-hours">0</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Daily Average</div>
                            <div class="stat-value" id="stat-daily-avg">0</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Most Productive Day</div>
                            <div class="stat-value" id="stat-best-day">-</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Tasks Completed</div>
                            <div class="stat-value" id="stat-tasks">0</div>
                        </div>
                    </div>
                </div>
            `;
            main.appendChild(chartsView);
        }
    }
    
    // ============ Event Listeners ============
    
    _setupEventListeners() {
        // Navigation button
        const chartsBtn = document.getElementById('btn-charts');
        if (chartsBtn) {
            chartsBtn.addEventListener('click', () => {
                this._switchToChartsView();
            });
        }
        
        // Period selector
        const periodSelect = document.getElementById('chart-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this._updateAllCharts();
            });
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('btn-refresh-charts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this._updateAllCharts();
            });
        }
    }
    
    _switchToChartsView() {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('btn-charts').classList.add('active');
        
        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById('view-charts').classList.add('active');
        
        // Update charts
        this._updateAllCharts();
    }
    
    // ============ Data Loading ============
    
    _loadChartData() {
        const days = parseInt(document.getElementById('chart-period')?.value || '7');
        const data = {
            daily: [],
            tasks: new Map(),
            hourly: new Array(24).fill(0),
            patterns: []
        };
        
        // Load data for each day
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const entries = storage.get(`entries_${dateStr}`) || [];
            
            // Daily totals
            const dailyTotal = entries.reduce((sum, e) => sum + e.duration, 0);
            data.daily.unshift({
                date: dateStr,
                hours: dailyTotal / (1000 * 60 * 60),
                entries: entries.length
            });
            
            // Task distribution
            entries.forEach(entry => {
                const key = entry.description.toLowerCase();
                data.tasks.set(key, (data.tasks.get(key) || 0) + entry.duration);
                
                // Hourly distribution
                const hour = new Date(entry.startTime).getHours();
                data.hourly[hour] += entry.duration;
            });
        }
        
        // Convert task map to sorted array
        data.taskArray = Array.from(data.tasks.entries())
            .map(([task, duration]) => ({ task, duration }))
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10); // Top 10 tasks
        
        return data;
    }
    
    // ============ Chart Rendering ============
    
    _updateAllCharts() {
        const data = this._loadChartData();
        
        this._renderDailyHoursChart(data.daily);
        this._renderTaskDistribution(data.taskArray);
        this._renderHeatmap(data.daily);
        this._renderPatterns(data.hourly);
        this._updateStats(data);
    }
    
    _renderDailyHoursChart(dailyData) {
        const container = document.getElementById('chart-daily-hours');
        if (!container) return;
        
        const width = container.clientWidth || 400;
        const height = 250;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Find max value
        const maxHours = Math.max(...dailyData.map(d => d.hours), 1);
        
        // Create SVG
        let svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(${margin.left},${margin.top})">
        `;
        
        // Draw bars
        const barWidth = chartWidth / dailyData.length;
        dailyData.forEach((day, i) => {
            const barHeight = (day.hours / maxHours) * chartHeight;
            const x = i * barWidth;
            const y = chartHeight - barHeight;
            
            svg += `
                <rect x="${x + barWidth * 0.1}" y="${y}" 
                      width="${barWidth * 0.8}" height="${barHeight}"
                      fill="${this.colors.primary}" opacity="0.8"
                      class="chart-bar">
                    <title>${day.date}: ${day.hours.toFixed(1)} hours</title>
                </rect>
            `;
            
            // Date label
            if (i % Math.ceil(dailyData.length / 7) === 0) {
                svg += `
                    <text x="${x + barWidth / 2}" y="${chartHeight + 20}"
                          text-anchor="middle" font-size="10" fill="#6b7280">
                        ${new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </text>
                `;
            }
        });
        
        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const y = chartHeight - (i / 4) * chartHeight;
            const value = (maxHours * i / 4).toFixed(1);
            svg += `
                <text x="-10" y="${y + 3}" text-anchor="end" font-size="10" fill="#6b7280">
                    ${value}h
                </text>
                <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" 
                      stroke="#e5e7eb" stroke-dasharray="2,2"/>
            `;
        }
        
        svg += '</g></svg>';
        container.innerHTML = svg;
    }
    
    _renderTaskDistribution(tasks) {
        const container = document.getElementById('chart-task-distribution');
        if (!container || tasks.length === 0) return;
        
        const width = container.clientWidth || 400;
        const height = 250;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        // Calculate total
        const total = tasks.reduce((sum, t) => sum + t.duration, 0);
        
        // Create pie chart
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        let currentAngle = -Math.PI / 2;
        const colors = [
            this.colors.primary, this.colors.success, this.colors.warning,
            this.colors.error, this.colors.gray, '#8b5cf6', '#ec4899',
            '#14b8a6', '#f97316', '#84cc16'
        ];
        
        tasks.forEach((task, i) => {
            const angle = (task.duration / total) * Math.PI * 2;
            const endAngle = currentAngle + angle;
            
            // Calculate path
            const x1 = centerX + Math.cos(currentAngle) * radius;
            const y1 = centerY + Math.sin(currentAngle) * radius;
            const x2 = centerX + Math.cos(endAngle) * radius;
            const y2 = centerY + Math.sin(endAngle) * radius;
            
            const largeArc = angle > Math.PI ? 1 : 0;
            
            svg += `
                <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
                      fill="${colors[i % colors.length]}" opacity="0.8" class="chart-slice">
                    <title>${task.task}: ${this._formatDuration(task.duration)} (${((task.duration / total) * 100).toFixed(1)}%)</title>
                </path>
            `;
            
            // Add label for significant slices
            if (task.duration / total > 0.05) {
                const labelAngle = currentAngle + angle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                svg += `
                    <text x="${labelX}" y="${labelY}" text-anchor="middle" 
                          font-size="11" fill="white" font-weight="500">
                        ${((task.duration / total) * 100).toFixed(0)}%
                    </text>
                `;
            }
            
            currentAngle = endAngle;
        });
        
        // Legend
        const legendY = 20;
        tasks.slice(0, 5).forEach((task, i) => {
            svg += `
                <rect x="${width - 120}" y="${legendY + i * 20}" width="12" height="12"
                      fill="${colors[i % colors.length]}" opacity="0.8"/>
                <text x="${width - 100}" y="${legendY + i * 20 + 10}" font-size="10" fill="#6b7280">
                    ${task.task.substring(0, 15)}${task.task.length > 15 ? '...' : ''}
                </text>
            `;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
    }
    
    _renderHeatmap(dailyData) {
        const container = document.getElementById('chart-heatmap');
        if (!container) return;
        
        const width = container.clientWidth || 400;
        const height = 250;
        
        // Group by week and day
        const weeks = [];
        let currentWeek = [];
        
        dailyData.forEach((day, i) => {
            const dayOfWeek = new Date(day.date).getDay();
            
            if (dayOfWeek === 0 && currentWeek.length > 0) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            
            currentWeek.push(day);
        });
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        // Calculate cell size
        const cellSize = Math.min((width - 50) / weeks.length, 30);
        const maxHours = Math.max(...dailyData.map(d => d.hours), 1);
        
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Day labels
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach((day, i) => {
            svg += `
                <text x="20" y="${30 + i * (cellSize + 2) + cellSize / 2}" 
                      text-anchor="middle" font-size="10" fill="#6b7280">
                    ${day}
                </text>
            `;
        });
        
        // Render cells
        weeks.forEach((week, weekIndex) => {
            week.forEach(day => {
                const dayOfWeek = new Date(day.date).getDay();
                const x = 40 + weekIndex * (cellSize + 2);
                const y = 20 + dayOfWeek * (cellSize + 2);
                const intensity = day.hours / maxHours;
                const color = intensity > 0 ? this.colors.primary : '#f3f4f6';
                const opacity = intensity * 0.8 + 0.2;
                
                svg += `
                    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                          fill="${color}" opacity="${opacity}" rx="2" class="heatmap-cell">
                        <title>${day.date}: ${day.hours.toFixed(1)} hours</title>
                    </rect>
                `;
            });
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
    }
    
    _renderPatterns(hourlyData) {
        const container = document.getElementById('chart-patterns');
        if (!container) return;
        
        const width = container.clientWidth || 400;
        const height = 250;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Find max value
        const maxValue = Math.max(...hourlyData, 1);
        
        // Create line chart
        let svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(${margin.left},${margin.top})">
        `;
        
        // Create path
        let path = 'M ';
        hourlyData.forEach((value, hour) => {
            const x = (hour / 23) * chartWidth;
            const y = chartHeight - (value / maxValue) * chartHeight;
            
            if (hour === 0) {
                path += `${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });
        
        // Fill area
        svg += `
            <path d="${path} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z"
                  fill="${this.colors.primary}" opacity="0.2"/>
            <path d="${path}" fill="none" stroke="${this.colors.primary}" 
                  stroke-width="2" stroke-linejoin="round"/>
        `;
        
        // Add points
        hourlyData.forEach((value, hour) => {
            if (value > 0) {
                const x = (hour / 23) * chartWidth;
                const y = chartHeight - (value / maxValue) * chartHeight;
                
                svg += `
                    <circle cx="${x}" cy="${y}" r="3" fill="${this.colors.primary}">
                        <title>${hour}:00 - ${this._formatDuration(value)}</title>
                    </circle>
                `;
            }
        });
        
        // X-axis labels
        for (let hour = 0; hour < 24; hour += 4) {
            const x = (hour / 23) * chartWidth;
            svg += `
                <text x="${x}" y="${chartHeight + 20}" text-anchor="middle" 
                      font-size="10" fill="#6b7280">
                    ${hour}:00
                </text>
            `;
        }
        
        svg += '</g></svg>';
        container.innerHTML = svg;
    }
    
    // ============ Statistics ============
    
    _updateStats(data) {
        // Total hours
        const totalHours = data.daily.reduce((sum, d) => sum + d.hours, 0);
        document.getElementById('stat-total-hours').textContent = totalHours.toFixed(1) + 'h';
        
        // Daily average
        const dailyAvg = totalHours / data.daily.length;
        document.getElementById('stat-daily-avg').textContent = dailyAvg.toFixed(1) + 'h';
        
        // Most productive day
        const bestDay = data.daily.reduce((best, day) => 
            day.hours > (best?.hours || 0) ? day : best, null);
        if (bestDay) {
            const date = new Date(bestDay.date);
            document.getElementById('stat-best-day').textContent = 
                date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        
        // Total tasks
        const totalTasks = data.daily.reduce((sum, d) => sum + d.entries, 0);
        document.getElementById('stat-tasks').textContent = totalTasks;
    }
    
    // ============ Utility Methods ============
    
    _formatDuration(ms) {
        const hours = ms / (1000 * 60 * 60);
        if (hours >= 1) {
            return hours.toFixed(1) + 'h';
        }
        const minutes = ms / (1000 * 60);
        return Math.round(minutes) + 'm';
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chartSystem = new ChartSystem();
    });
} else {
    window.chartSystem = new ChartSystem();
}