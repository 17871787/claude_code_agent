/**
 * VibeLog Pro - Main Application
 */

// Initialize storage manager
const storage = new StorageManager();

// Application state
const app = {
    currentView: 'timesheet',
    currentTimer: null,
    entries: [],
    settings: {
        workStart: '09:00',
        workEnd: '17:00',
        pingInterval: 60,
        pingEnabled: true
    }
};

// ============ Initialization ============

document.addEventListener('DOMContentLoaded', () => {
    console.log('VibeLog Pro initializing...');
    
    // Load saved data
    loadSettings();
    loadEntries();
    
    // Setup event listeners
    setupNavigation();
    setupTimesheet();
    setupSettings();
    
    // Update storage info
    updateStorageInfo();
    
    // Start ping timer if enabled
    if (app.settings.pingEnabled) {
        startPingTimer();
    }
    
    console.log('VibeLog Pro ready!');
    showNotification('VibeLog Pro loaded successfully');
});

// ============ Navigation ============

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewName = e.target.id.replace('btn-', '');
            switchView(viewName);
        });
    });
}

function switchView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${viewName}`).classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    app.currentView = viewName;
}

// ============ Timesheet ============

function setupTimesheet() {
    const quickDescription = document.getElementById('quick-description');
    const startBtn = document.getElementById('btn-start-timer');
    
    startBtn.addEventListener('click', () => {
        const description = quickDescription.value.trim();
        if (!description) {
            showNotification('Please enter a description', 'error');
            return;
        }
        
        if (app.currentTimer) {
            stopTimer();
        } else {
            startTimer(description);
        }
    });
    
    // Enter key to start/stop
    quickDescription.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startBtn.click();
        }
    });
}

function startTimer(description) {
    app.currentTimer = {
        description: description,
        startTime: Date.now(),
        id: generateId()
    };
    
    document.getElementById('btn-start-timer').textContent = 'Stop';
    document.getElementById('quick-description').disabled = true;
    
    showNotification(`Timer started: ${description}`);
}

function stopTimer() {
    if (!app.currentTimer) return;
    
    const entry = {
        id: app.currentTimer.id,
        description: app.currentTimer.description,
        startTime: app.currentTimer.startTime,
        endTime: Date.now(),
        duration: Date.now() - app.currentTimer.startTime,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Save entry
    app.entries.push(entry);
    saveEntry(entry);
    
    // Update UI
    displayEntry(entry);
    document.getElementById('btn-start-timer').textContent = 'Start';
    document.getElementById('quick-description').disabled = false;
    document.getElementById('quick-description').value = '';
    
    app.currentTimer = null;
    
    showNotification(`Timer stopped: ${formatDuration(entry.duration)}`);
}

function displayEntry(entry) {
    const container = document.getElementById('today-entries');
    const entryEl = document.createElement('div');
    entryEl.className = 'entry';
    entryEl.innerHTML = `
        <div class="entry-time">${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}</div>
        <div class="entry-description">${entry.description}</div>
        <div class="entry-duration">${formatDuration(entry.duration)}</div>
    `;
    container.insertBefore(entryEl, container.firstChild);
}

// ============ Settings ============

function setupSettings() {
    // Work hours
    document.getElementById('work-start').addEventListener('change', (e) => {
        app.settings.workStart = e.target.value;
        saveSettings();
    });
    
    document.getElementById('work-end').addEventListener('change', (e) => {
        app.settings.workEnd = e.target.value;
        saveSettings();
    });
    
    // Ping settings
    document.getElementById('ping-interval').addEventListener('change', (e) => {
        app.settings.pingInterval = parseInt(e.target.value);
        saveSettings();
        if (app.settings.pingEnabled) {
            restartPingTimer();
        }
    });
    
    document.getElementById('ping-enabled').addEventListener('change', (e) => {
        app.settings.pingEnabled = e.target.checked;
        saveSettings();
        if (app.settings.pingEnabled) {
            startPingTimer();
        } else {
            stopPingTimer();
        }
    });
    
    // Export buttons
    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
    document.getElementById('btn-export-markdown').addEventListener('click', exportToMarkdown);
    
    // Clear data
    document.getElementById('btn-clear-data').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            clearAllData();
        }
    });
}

// ============ Storage Operations ============

function saveEntry(entry) {
    try {
        // Get existing entries for today
        const todayKey = `entries_${entry.date}`;
        let todayEntries = storage.get(todayKey) || [];
        todayEntries.push(entry);
        
        // Save back
        storage.set(todayKey, todayEntries);
        
        // Update storage info
        updateStorageInfo();
    } catch (error) {
        console.error('Failed to save entry:', error);
        showNotification('Failed to save entry', 'error');
    }
}

function loadEntries() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayKey = `entries_${today}`;
        const entries = storage.get(todayKey) || [];
        
        app.entries = entries;
        
        // Display entries
        entries.forEach(entry => displayEntry(entry));
    } catch (error) {
        console.error('Failed to load entries:', error);
    }
}

function saveSettings() {
    try {
        storage.set('settings', app.settings, true); // Save immediately
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function loadSettings() {
    try {
        const saved = storage.get('settings');
        if (saved) {
            app.settings = { ...app.settings, ...saved };
            
            // Update UI
            document.getElementById('work-start').value = app.settings.workStart;
            document.getElementById('work-end').value = app.settings.workEnd;
            document.getElementById('ping-interval').value = app.settings.pingInterval;
            document.getElementById('ping-enabled').checked = app.settings.pingEnabled;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function updateStorageInfo() {
    const stats = storage.getStats();
    const info = document.getElementById('storage-info');
    
    info.innerHTML = `
        <div>Total Entries: ${stats.totalKeys}</div>
        <div>Storage Used: ${formatBytes(stats.compressedSize)}</div>
        <div>Uncompressed: ${formatBytes(stats.totalSize)}</div>
        <div>Compression: ${stats.compressionRatio.toFixed(1)}%</div>
        <div>Chunks: ${stats.chunks.length}</div>
    `;
}

function clearAllData() {
    storage.clear();
    app.entries = [];
    document.getElementById('today-entries').innerHTML = '';
    updateStorageInfo();
    showNotification('All data cleared');
}

// ============ Export Functions ============

function exportToCSV() {
    const entries = getAllEntries();
    let csv = 'Date,Start Time,End Time,Duration,Description\n';
    
    entries.forEach(entry => {
        csv += `${entry.date},${formatTime(entry.startTime)},${formatTime(entry.endTime)},${formatDuration(entry.duration)},"${entry.description}"\n`;
    });
    
    downloadFile('vibelog-export.csv', csv, 'text/csv');
}

function exportToMarkdown() {
    const entries = getAllEntries();
    let md = '# VibeLog Time Entries\n\n';
    
    const entriesByDate = {};
    entries.forEach(entry => {
        if (!entriesByDate[entry.date]) {
            entriesByDate[entry.date] = [];
        }
        entriesByDate[entry.date].push(entry);
    });
    
    Object.keys(entriesByDate).sort().reverse().forEach(date => {
        md += `## ${date}\n\n`;
        md += '| Time | Duration | Description |\n';
        md += '|------|----------|-------------|\n';
        
        entriesByDate[date].forEach(entry => {
            md += `| ${formatTime(entry.startTime)} - ${formatTime(entry.endTime)} | ${formatDuration(entry.duration)} | ${entry.description} |\n`;
        });
        
        md += '\n';
    });
    
    downloadFile('vibelog-export.md', md, 'text/markdown');
}

function getAllEntries() {
    const allEntries = [];
    const keys = storage.keys();
    
    keys.forEach(key => {
        if (key.startsWith('entries_')) {
            const entries = storage.get(key) || [];
            allEntries.push(...entries);
        }
    });
    
    return allEntries.sort((a, b) => b.startTime - a.startTime);
}

// ============ Ping Timer ============

let pingInterval = null;

function startPingTimer() {
    stopPingTimer();
    
    pingInterval = setInterval(() => {
        // Check if within work hours
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime >= app.settings.workStart && currentTime <= app.settings.workEnd) {
            showPingNotification();
        }
    }, app.settings.pingInterval * 60 * 1000);
}

function stopPingTimer() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

function restartPingTimer() {
    stopPingTimer();
    startPingTimer();
}

function showPingNotification() {
    showNotification('Time to log your work!', 'info');
    
    // Also show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('VibeLog Pro', {
            body: 'Time to log your work!',
            icon: '/favicon.ico'
        });
    }
}

// ============ Utility Functions ============

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}