/**
 * Enhanced Timesheet Export
 * Generates formatted reports for easy timesheet completion
 */

class TimesheetExport {
    constructor() {
        this._enhanceExportButtons();
    }
    
    _enhanceExportButtons() {
        // Replace existing export buttons with enhanced versions
        const csvBtn = document.getElementById('btn-export-csv');
        const mdBtn = document.getElementById('btn-export-markdown');
        
        if (csvBtn) {
            csvBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showExportOptions();
            });
        }
        
        if (mdBtn) {
            mdBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportMarkdown();
            });
        }
    }
    
    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-content">
                <div class="export-header">
                    <h2>Export Timesheet</h2>
                    <button class="export-close">&times;</button>
                </div>
                
                <div class="export-body">
                    <div class="export-options">
                        <label>
                            Date Range:
                            <select id="export-range">
                                <option value="today">Today</option>
                                <option value="week" selected>This Week</option>
                                <option value="lastweek">Last Week</option>
                                <option value="month">This Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </label>
                        
                        <div id="custom-range" style="display: none;">
                            <label>
                                From:
                                <input type="date" id="export-from">
                            </label>
                            <label>
                                To:
                                <input type="date" id="export-to">
                            </label>
                        </div>
                        
                        <label>
                            Group By:
                            <select id="export-grouping">
                                <option value="day">Day</option>
                                <option value="project">Project</option>
                                <option value="category">Category</option>
                                <option value="none">No Grouping</option>
                            </select>
                        </label>
                        
                        <label>
                            Format:
                            <select id="export-format">
                                <option value="detailed">Detailed (All Entries)</option>
                                <option value="summary">Summary (Totals Only)</option>
                                <option value="timesheet">Timesheet Format</option>
                                <option value="invoice">Invoice Format</option>
                            </select>
                        </label>
                        
                        <label>
                            <input type="checkbox" id="export-round" checked>
                            Round to nearest 15 minutes
                        </label>
                        
                        <label>
                            <input type="checkbox" id="export-gaps">
                            Include gap analysis
                        </label>
                    </div>
                    
                    <div class="export-preview">
                        <h3>Preview</h3>
                        <pre id="export-preview-content"></pre>
                    </div>
                </div>
                
                <div class="export-footer">
                    <button id="export-copy">Copy to Clipboard</button>
                    <button id="export-download-csv">Download CSV</button>
                    <button id="export-download-txt">Download Text</button>
                    <button id="export-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind events
        this._bindExportEvents(modal);
        
        // Generate initial preview
        this._updatePreview();
    }
    
    _bindExportEvents(modal) {
        // Close button
        modal.querySelector('.export-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Cancel button
        document.getElementById('export-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        // Range change
        document.getElementById('export-range').addEventListener('change', (e) => {
            const customRange = document.getElementById('custom-range');
            customRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
            this._updatePreview();
        });
        
        // Other option changes
        ['export-grouping', 'export-format', 'export-round', 'export-gaps'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this._updatePreview();
            });
        });
        
        // Copy button
        document.getElementById('export-copy').addEventListener('click', () => {
            const content = document.getElementById('export-preview-content').textContent;
            navigator.clipboard.writeText(content);
            this._showNotification('Copied to clipboard!', 'success');
        });
        
        // Download CSV
        document.getElementById('export-download-csv').addEventListener('click', () => {
            const data = this._generateExport('csv');
            this._downloadFile(data.content, data.filename, 'text/csv');
        });
        
        // Download Text
        document.getElementById('export-download-txt').addEventListener('click', () => {
            const data = this._generateExport('text');
            this._downloadFile(data.content, data.filename, 'text/plain');
        });
    }
    
    _updatePreview() {
        const preview = document.getElementById('export-preview-content');
        if (!preview) return;
        
        const data = this._generateExport('text');
        preview.textContent = data.content;
    }
    
    _generateExport(type) {
        const range = document.getElementById('export-range')?.value || 'week';
        const grouping = document.getElementById('export-grouping')?.value || 'day';
        const format = document.getElementById('export-format')?.value || 'detailed';
        const round = document.getElementById('export-round')?.checked ?? true;
        const includeGaps = document.getElementById('export-gaps')?.checked ?? false;
        
        // Get entries for range
        const entries = this._getEntriesForRange(range);
        
        // Round times if requested
        const processedEntries = round ? this._roundEntries(entries) : entries;
        
        // Generate content based on format
        let content = '';
        let filename = '';
        
        switch (format) {
            case 'timesheet':
                content = this._generateTimesheetFormat(processedEntries, grouping, type);
                filename = `timesheet_${range}_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'invoice':
                content = this._generateInvoiceFormat(processedEntries, grouping, type);
                filename = `invoice_${range}_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'summary':
                content = this._generateSummaryFormat(processedEntries, grouping, type);
                filename = `summary_${range}_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                content = this._generateDetailedFormat(processedEntries, grouping, type);
                filename = `timesheet_detailed_${range}_${new Date().toISOString().split('T')[0]}`;
        }
        
        // Add gap analysis if requested
        if (includeGaps) {
            content += '\n\n' + this._generateGapAnalysis(entries);
        }
        
        return {
            content: content,
            filename: filename + (type === 'csv' ? '.csv' : '.txt')
        };
    }
    
    _generateTimesheetFormat(entries, grouping, type) {
        let output = '';
        const grouped = this._groupEntries(entries, grouping);
        
        if (type === 'csv') {
            output = 'Date,Project,Description,Hours\n';
            
            grouped.forEach((group, key) => {
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                const description = group.map(e => e.description).join('; ');
                const date = grouping === 'day' ? key : new Date(group[0].startTime).toLocaleDateString();
                const project = this._extractProjectFromEntries(group);
                
                output += `"${date}","${project}","${description}","${totalHours.toFixed(2)}"\n`;
            });
        } else {
            output = 'TIMESHEET REPORT\n';
            output += '================\n\n';
            
            grouped.forEach((group, key) => {
                output += `${key}\n`;
                output += '-'.repeat(key.length) + '\n';
                
                group.forEach(entry => {
                    const hours = (entry.duration / 3600000).toFixed(2);
                    output += `  ${entry.description.padEnd(50)} ${hours}h\n`;
                });
                
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                output += `  ${'TOTAL:'.padEnd(50)} ${totalHours.toFixed(2)}h\n\n`;
            });
            
            const grandTotal = entries.reduce((sum, e) => sum + e.duration, 0) / 3600000;
            output += `GRAND TOTAL: ${grandTotal.toFixed(2)} hours\n`;
        }
        
        return output;
    }
    
    _generateInvoiceFormat(entries, grouping, type) {
        const rate = 100; // Default hourly rate - could make this configurable
        let output = '';
        const grouped = this._groupEntries(entries, 'project');
        
        if (type === 'csv') {
            output = 'Project,Description,Hours,Rate,Amount\n';
            
            grouped.forEach((group, project) => {
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                const descriptions = [...new Set(group.map(e => e.description))].join('; ');
                const amount = totalHours * rate;
                
                output += `"${project}","${descriptions}","${totalHours.toFixed(2)}","$${rate}","$${amount.toFixed(2)}"\n`;
            });
        } else {
            output = 'INVOICE SUMMARY\n';
            output += '===============\n\n';
            
            let totalAmount = 0;
            
            grouped.forEach((group, project) => {
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                const amount = totalHours * rate;
                totalAmount += amount;
                
                output += `${project}\n`;
                output += `  Hours: ${totalHours.toFixed(2)}\n`;
                output += `  Rate: $${rate}/hour\n`;
                output += `  Amount: $${amount.toFixed(2)}\n\n`;
            });
            
            output += `TOTAL DUE: $${totalAmount.toFixed(2)}\n`;
        }
        
        return output;
    }
    
    _generateSummaryFormat(entries, grouping, type) {
        let output = '';
        const grouped = this._groupEntries(entries, grouping);
        
        if (type === 'csv') {
            output = `${grouping},Hours,Entries\n`;
            
            grouped.forEach((group, key) => {
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                output += `"${key}","${totalHours.toFixed(2)}","${group.length}"\n`;
            });
        } else {
            output = 'TIME SUMMARY\n';
            output += '============\n\n';
            
            grouped.forEach((group, key) => {
                const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
                output += `${key}: ${totalHours.toFixed(2)}h (${group.length} entries)\n`;
            });
            
            output += '\n';
            const totalHours = entries.reduce((sum, e) => sum + e.duration, 0) / 3600000;
            output += `Total: ${totalHours.toFixed(2)} hours across ${entries.length} entries\n`;
        }
        
        return output;
    }
    
    _generateDetailedFormat(entries, grouping, type) {
        if (type === 'csv') {
            let output = 'Date,Time,Duration,Project,Category,Description\n';
            
            entries.forEach(entry => {
                const date = new Date(entry.startTime).toLocaleDateString();
                const time = new Date(entry.startTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const duration = (entry.duration / 3600000).toFixed(2);
                const project = entry.project || this._extractProject(entry.description) || '';
                const category = entry.category || '';
                
                output += `"${date}","${time}","${duration}","${project}","${category}","${entry.description}"\n`;
            });
            
            return output;
        } else {
            let output = 'DETAILED TIME LOG\n';
            output += '=================\n\n';
            
            entries.forEach(entry => {
                const date = new Date(entry.startTime).toLocaleDateString();
                const startTime = new Date(entry.startTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const endTime = new Date(entry.endTime || entry.startTime + entry.duration).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const duration = (entry.duration / 3600000).toFixed(2);
                
                output += `${date} | ${startTime} - ${endTime} (${duration}h)\n`;
                output += `  ${entry.description}\n`;
                if (entry.project) output += `  Project: ${entry.project}\n`;
                if (entry.category) output += `  Category: ${entry.category}\n`;
                output += '\n';
            });
            
            return output;
        }
    }
    
    _generateGapAnalysis(entries) {
        let output = 'GAP ANALYSIS\n';
        output += '============\n\n';
        
        if (entries.length === 0) {
            output += 'No entries to analyze.\n';
            return output;
        }
        
        // Sort entries
        entries.sort((a, b) => a.startTime - b.startTime);
        
        const gaps = [];
        for (let i = 0; i < entries.length - 1; i++) {
            const gap = entries[i + 1].startTime - (entries[i].endTime || entries[i].startTime + entries[i].duration);
            if (gap > 900000) { // > 15 minutes
                gaps.push({
                    start: entries[i].endTime || entries[i].startTime + entries[i].duration,
                    end: entries[i + 1].startTime,
                    duration: gap
                });
            }
        }
        
        if (gaps.length === 0) {
            output += 'No significant gaps found.\n';
        } else {
            gaps.forEach(gap => {
                const startTime = new Date(gap.start).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const endTime = new Date(gap.end).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const duration = (gap.duration / 3600000).toFixed(2);
                
                output += `${startTime} - ${endTime}: ${duration}h unaccounted\n`;
            });
            
            const totalGapTime = gaps.reduce((sum, gap) => sum + gap.duration, 0) / 3600000;
            output += `\nTotal unaccounted time: ${totalGapTime.toFixed(2)} hours\n`;
        }
        
        return output;
    }
    
    _groupEntries(entries, grouping) {
        const grouped = new Map();
        
        entries.forEach(entry => {
            let key;
            
            switch (grouping) {
                case 'day':
                    key = new Date(entry.startTime).toLocaleDateString();
                    break;
                case 'project':
                    key = entry.project || this._extractProject(entry.description) || 'No Project';
                    break;
                case 'category':
                    key = entry.category || window.smartIntelligence?.categorizeEntry(entry.description)?.name || 'Uncategorized';
                    break;
                default:
                    key = 'All Entries';
            }
            
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(entry);
        });
        
        return grouped;
    }
    
    _roundEntries(entries) {
        return entries.map(entry => ({
            ...entry,
            duration: this._roundToNearest15(entry.duration)
        }));
    }
    
    _roundToNearest15(ms) {
        const minutes = ms / 60000;
        const rounded = Math.round(minutes / 15) * 15;
        return rounded * 60000;
    }
    
    _getEntriesForRange(range) {
        const entries = [];
        let startDate, endDate;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (range) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(today);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'lastweek':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay() - 7);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'custom':
                const fromInput = document.getElementById('export-from')?.value;
                const toInput = document.getElementById('export-to')?.value;
                if (fromInput && toInput) {
                    startDate = new Date(fromInput);
                    endDate = new Date(toInput);
                } else {
                    startDate = new Date(today);
                    endDate = new Date(today);
                }
                break;
        }
        
        // Get entries for date range
        const current = new Date(startDate);
        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            const dayEntries = storage.get(`entries_${dateStr}`) || [];
            entries.push(...dayEntries);
            current.setDate(current.getDate() + 1);
        }
        
        return entries.sort((a, b) => a.startTime - b.startTime);
    }
    
    _extractProject(description) {
        // Try to extract project from description
        const patterns = [
            /(?:project|client):\s*([^,\.\;]+)/i,
            /\[([^\]]+)\]/,
            /#(\w+)/,
            /^(\w+):/
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    _extractProjectFromEntries(entries) {
        // Find most common project in group
        const projects = entries
            .map(e => e.project || this._extractProject(e.description))
            .filter(p => p);
        
        if (projects.length === 0) return 'General';
        
        const counts = {};
        projects.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });
        
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    _downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    _showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }
    
    exportMarkdown() {
        const entries = this._getEntriesForRange('week');
        let output = '# Weekly Time Report\n\n';
        output += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        const grouped = this._groupEntries(entries, 'day');
        
        grouped.forEach((group, day) => {
            output += `## ${day}\n\n`;
            
            group.forEach(entry => {
                const hours = (entry.duration / 3600000).toFixed(2);
                output += `- **${entry.description}** (${hours}h)\n`;
            });
            
            const totalHours = group.reduce((sum, e) => sum + e.duration, 0) / 3600000;
            output += `\n**Day Total: ${totalHours.toFixed(2)} hours**\n\n`;
        });
        
        const grandTotal = entries.reduce((sum, e) => sum + e.duration, 0) / 3600000;
        output += `---\n\n**Week Total: ${grandTotal.toFixed(2)} hours**\n`;
        
        this._downloadFile(output, `weekly_report_${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.timesheetExport = new TimesheetExport();
    });
} else {
    window.timesheetExport = new TimesheetExport();
}