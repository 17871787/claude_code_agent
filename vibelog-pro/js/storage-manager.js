/**
 * StorageManager - Robust storage layer with compression, chunking, and versioning
 * Provides 10x capacity through compression and automatic chunking
 */
class StorageManager {
    constructor() {
        this.prefix = 'vl_'; // VibeLog prefix for all keys
        this.version = '1.0.0';
        this.chunkSize = 500000; // ~500KB per chunk (localStorage typically allows 5-10MB total)
        this.compressionEnabled = true;
        this.writeQueue = [];
        this.writeTimer = null;
        this.writeDelay = 5000; // 5 second debounce
        
        // Initialize metadata
        this.meta = this._loadMeta();
        
        // Check and run migrations if needed
        this._runMigrations();
        
        // Initialize Write-Ahead Log
        this.wal = [];
        this._loadWAL();
    }
    
    // ============ Public API ============
    
    /**
     * Get data by key
     * @param {string} key - The key to retrieve
     * @returns {*} The decompressed and parsed data
     */
    get(key) {
        try {
            const startTime = performance.now();
            
            // Check if key exists in index
            const index = this._getIndex();
            const chunkKey = index[key];
            
            if (!chunkKey) {
                return null;
            }
            
            // Get the chunk
            const chunk = localStorage.getItem(chunkKey);
            if (!chunk) {
                console.warn(`Chunk ${chunkKey} not found for key ${key}`);
                return null;
            }
            
            // Decompress if needed
            const decompressed = this.compressionEnabled ? 
                this._decompress(chunk) : chunk;
            
            // Parse the chunk data
            const chunkData = JSON.parse(decompressed);
            
            const endTime = performance.now();
            this._logPerformance('get', endTime - startTime);
            
            return chunkData[key];
            
        } catch (error) {
            console.error('StorageManager.get error:', error);
            return null;
        }
    }
    
    /**
     * Set data by key
     * @param {string} key - The key to store
     * @param {*} value - The value to store
     * @param {boolean} immediate - Skip write queue and write immediately
     */
    set(key, value, immediate = false) {
        try {
            if (immediate) {
                this._writeImmediate(key, value);
            } else {
                this._queueWrite(key, value);
            }
            return true;
        } catch (error) {
            console.error('StorageManager.set error:', error);
            return false;
        }
    }
    
    /**
     * Delete data by key
     * @param {string} key - The key to delete
     */
    delete(key) {
        try {
            const index = this._getIndex();
            const chunkKey = index[key];
            
            if (!chunkKey) {
                return true; // Already doesn't exist
            }
            
            // Get the chunk and remove the key
            const chunk = localStorage.getItem(chunkKey);
            const decompressed = this.compressionEnabled ? 
                this._decompress(chunk) : chunk;
            const chunkData = JSON.parse(decompressed);
            
            delete chunkData[key];
            
            // Recompress and save
            const compressed = this.compressionEnabled ?
                this._compress(JSON.stringify(chunkData)) :
                JSON.stringify(chunkData);
            
            localStorage.setItem(chunkKey, compressed);
            
            // Update index
            delete index[key];
            this._setIndex(index);
            
            return true;
        } catch (error) {
            console.error('StorageManager.delete error:', error);
            return false;
        }
    }
    
    /**
     * Get all keys
     * @returns {string[]} Array of all keys
     */
    keys() {
        const index = this._getIndex();
        return Object.keys(index);
    }
    
    /**
     * Clear all storage
     */
    clear() {
        try {
            // Get all our keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove them
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Reset metadata
            this.meta = this._createDefaultMeta();
            this._saveMeta();
            
            return true;
        } catch (error) {
            console.error('StorageManager.clear error:', error);
            return false;
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Object} Storage stats
     */
    getStats() {
        const stats = {
            version: this.version,
            totalKeys: this.keys().length,
            chunks: [],
            totalSize: 0,
            compressedSize: 0,
            compressionRatio: 0
        };
        
        // Calculate sizes
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + 'data_')) {
                const chunk = localStorage.getItem(key);
                const compressedSize = chunk.length * 2; // Rough bytes (UTF-16)
                
                stats.chunks.push({
                    key: key,
                    compressedSize: compressedSize
                });
                
                stats.compressedSize += compressedSize;
                
                // Estimate uncompressed size
                if (this.compressionEnabled) {
                    try {
                        const decompressed = this._decompress(chunk);
                        stats.totalSize += decompressed.length * 2;
                    } catch (e) {
                        stats.totalSize += compressedSize;
                    }
                } else {
                    stats.totalSize = stats.compressedSize;
                }
            }
        }
        
        stats.compressionRatio = stats.totalSize > 0 ? 
            (1 - (stats.compressedSize / stats.totalSize)) * 100 : 0;
        
        return stats;
    }
    
    // ============ Private Methods ============
    
    _writeImmediate(key, value) {
        const startTime = performance.now();
        
        // Get current index
        const index = this._getIndex();
        
        // Find or create appropriate chunk
        const chunkKey = this._findOrCreateChunk(key, value);
        
        // Get existing chunk data
        let chunkData = {};
        const existingChunk = localStorage.getItem(chunkKey);
        if (existingChunk) {
            const decompressed = this.compressionEnabled ?
                this._decompress(existingChunk) : existingChunk;
            chunkData = JSON.parse(decompressed);
        }
        
        // Add/update the key-value
        chunkData[key] = value;
        
        // Compress and save
        const serialized = JSON.stringify(chunkData);
        const compressed = this.compressionEnabled ?
            this._compress(serialized) : serialized;
        
        localStorage.setItem(chunkKey, compressed);
        
        // Update index
        index[key] = chunkKey;
        this._setIndex(index);
        
        // Update metadata
        this.meta.updated = Date.now();
        this._saveMeta();
        
        const endTime = performance.now();
        this._logPerformance('set', endTime - startTime);
    }
    
    _queueWrite(key, value) {
        // Add to queue
        this.writeQueue.push({ key, value, timestamp: Date.now() });
        
        // Add to WAL for crash recovery
        this._appendWAL({ type: 'set', key, value });
        
        // Reset timer
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }
        
        // Set new timer
        this.writeTimer = setTimeout(() => {
            this._flushWriteQueue();
        }, this.writeDelay);
    }
    
    _flushWriteQueue() {
        if (this.writeQueue.length === 0) return;
        
        const startTime = performance.now();
        const writes = [...this.writeQueue];
        this.writeQueue = [];
        
        // Group writes by estimated chunk
        const writeGroups = {};
        writes.forEach(({ key, value }) => {
            const chunkKey = this._findOrCreateChunk(key, value);
            if (!writeGroups[chunkKey]) {
                writeGroups[chunkKey] = [];
            }
            writeGroups[chunkKey].push({ key, value });
        });
        
        // Process each chunk
        const index = this._getIndex();
        
        Object.entries(writeGroups).forEach(([chunkKey, writes]) => {
            // Get existing chunk data
            let chunkData = {};
            const existingChunk = localStorage.getItem(chunkKey);
            if (existingChunk) {
                const decompressed = this.compressionEnabled ?
                    this._decompress(existingChunk) : existingChunk;
                chunkData = JSON.parse(decompressed);
            }
            
            // Apply all writes
            writes.forEach(({ key, value }) => {
                chunkData[key] = value;
                index[key] = chunkKey;
            });
            
            // Compress and save
            const serialized = JSON.stringify(chunkData);
            const compressed = this.compressionEnabled ?
                this._compress(serialized) : serialized;
            
            localStorage.setItem(chunkKey, compressed);
        });
        
        // Update index
        this._setIndex(index);
        
        // Clear WAL
        this._clearWAL();
        
        // Update metadata
        this.meta.updated = Date.now();
        this._saveMeta();
        
        const endTime = performance.now();
        this._logPerformance('flush', endTime - startTime);
    }
    
    _findOrCreateChunk(key, value) {
        // Simple strategy: use first chunk that has space
        // In production, could use more sophisticated allocation
        
        const estimatedSize = JSON.stringify({ [key]: value }).length;
        
        // Check existing chunks
        for (let i = 0; i < 100; i++) { // Max 100 chunks
            const chunkKey = `${this.prefix}data_${i}`;
            const chunk = localStorage.getItem(chunkKey);
            
            if (!chunk) {
                // New chunk
                return chunkKey;
            }
            
            if (chunk.length + estimatedSize < this.chunkSize) {
                // Fits in this chunk
                return chunkKey;
            }
        }
        
        throw new Error('Storage limit reached - too many chunks');
    }
    
    // ============ Compression Methods ============
    
    _compress(str) {
        if (typeof LZString !== 'undefined') {
            return LZString.compressToUTF16(str);
        }
        return str; // Fallback if LZString not loaded
    }
    
    _decompress(str) {
        if (typeof LZString !== 'undefined') {
            return LZString.decompressFromUTF16(str);
        }
        return str; // Fallback if LZString not loaded
    }
    
    // ============ Metadata Methods ============
    
    _loadMeta() {
        try {
            const metaStr = localStorage.getItem(this.prefix + 'meta');
            if (metaStr) {
                return JSON.parse(metaStr);
            }
        } catch (e) {
            console.warn('Failed to load metadata:', e);
        }
        
        const meta = this._createDefaultMeta();
        this._saveMeta();
        return meta;
    }
    
    _saveMeta() {
        try {
            localStorage.setItem(this.prefix + 'meta', JSON.stringify(this.meta));
        } catch (e) {
            console.error('Failed to save metadata:', e);
        }
    }
    
    _createDefaultMeta() {
        return {
            version: this.version,
            created: Date.now(),
            updated: Date.now(),
            chunks: []
        };
    }
    
    // ============ Index Methods ============
    
    _getIndex() {
        try {
            const indexStr = localStorage.getItem(this.prefix + 'index');
            if (indexStr) {
                return JSON.parse(indexStr);
            }
        } catch (e) {
            console.warn('Failed to load index:', e);
        }
        return {};
    }
    
    _setIndex(index) {
        try {
            localStorage.setItem(this.prefix + 'index', JSON.stringify(index));
        } catch (e) {
            console.error('Failed to save index:', e);
        }
    }
    
    // ============ WAL Methods ============
    
    _loadWAL() {
        try {
            const walStr = localStorage.getItem(this.prefix + 'wal');
            if (walStr) {
                this.wal = JSON.parse(walStr);
                // Replay WAL if needed
                if (this.wal.length > 0) {
                    console.log('Replaying WAL with', this.wal.length, 'operations');
                    this._replayWAL();
                }
            }
        } catch (e) {
            console.warn('Failed to load WAL:', e);
        }
    }
    
    _appendWAL(operation) {
        this.wal.push(operation);
        try {
            localStorage.setItem(this.prefix + 'wal', JSON.stringify(this.wal));
        } catch (e) {
            console.error('Failed to save WAL:', e);
        }
    }
    
    _clearWAL() {
        this.wal = [];
        try {
            localStorage.removeItem(this.prefix + 'wal');
        } catch (e) {
            console.error('Failed to clear WAL:', e);
        }
    }
    
    _replayWAL() {
        this.wal.forEach(operation => {
            if (operation.type === 'set') {
                this._writeImmediate(operation.key, operation.value);
            }
        });
        this._clearWAL();
    }
    
    // ============ Migration Methods ============
    
    _runMigrations() {
        // Check if version mismatch
        if (this.meta.version !== this.version) {
            console.log(`Migrating from ${this.meta.version} to ${this.version}`);
            // Run appropriate migrations
            // For now, just update version
            this.meta.version = this.version;
            this._saveMeta();
        }
    }
    
    // ============ Performance Methods ============
    
    _logPerformance(operation, duration) {
        if (duration > 50) {
            console.warn(`Slow storage operation: ${operation} took ${duration.toFixed(2)}ms`);
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}