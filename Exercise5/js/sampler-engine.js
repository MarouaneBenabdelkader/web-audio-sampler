// Sampler Engine - Headless audio processing
// Can work without GUI for testing

export default class SamplerEngine {
    constructor() {
        this.audioContext = null;
        this.sounds = new Array(16).fill(null); // 16 pads (4x4)
        this.progressCallbacks = [];
        this.stateCallbacks = [];
    }

    // Initialize audio context
    init() {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    // Subscribe to progress updates
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    // Subscribe to state changes
    onStateChange(callback) {
        this.stateCallbacks.push(callback);
    }

    // Emit progress event
    emitProgress(index, loaded, total) {
        const percentage = total > 0 ? (loaded / total) * 100 : 0;
        this.progressCallbacks.forEach(cb => cb(index, percentage, loaded, total));
    }

    // Emit state change event
    emitStateChange(index, state, error = null) {
        this.stateCallbacks.forEach(cb => cb(index, state, error));
    }

    // Load a single sound with progress tracking
    async loadSound(url, index) {
        this.init();
        this.emitStateChange(index, 'loading');

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Get total size
            const contentLength = response.headers.get('Content-Length');
            const total = parseInt(contentLength, 10);

            // Read stream in chunks
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                // Emit progress
                this.emitProgress(index, receivedLength, total);
            }

            // Merge chunks
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }

            // Decode audio
            const audioBuffer = await this.audioContext.decodeAudioData(allChunks.buffer);
            this.sounds[index] = audioBuffer;

            this.emitStateChange(index, 'loaded');
            return audioBuffer;

        } catch (error) {
            console.error(`Failed to load sound ${index}:`, error);
            this.emitStateChange(index, 'error', error.message);
            throw error;
        }
    }

    // Load all sounds using Promise.allSettled
    async loadAll(urls) {
        this.init();

        const promises = urls.map((url, index) => 
            this.loadSound(url, index)
        );

        const results = await Promise.allSettled(promises);

        // Return summary
        const summary = {
            total: results.length,
            loaded: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results: results
        };

        console.log('Load Summary:', summary);
        return summary;
    }

    // Play a sound by index
    playSound(index) {
        if (!this.audioContext) {
            console.warn('Audio context not initialized');
            return;
        }

        const buffer = this.sounds[index];
        
        if (!buffer) {
            console.warn(`No sound loaded at index ${index}`);
            return;
        }

        // Create buffer source (one-shot)
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        console.log(`Playing sound ${index}`);
    }

    // Check if sound is loaded
    isSoundLoaded(index) {
        return this.sounds[index] !== null;
    }

    // Get loaded sounds count
    getLoadedCount() {
        return this.sounds.filter(s => s !== null).length;
    }

    // Clear all sounds
    clearAll() {
        this.sounds.fill(null);
        for (let i = 0; i < 16; i++) {
            this.emitStateChange(i, 'empty');
            this.emitProgress(i, 0, 100);
        }
    }
}
