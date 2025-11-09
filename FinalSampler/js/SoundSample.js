/**
 * SoundSample Class
 * Represents an individual sound sample with its audio buffer and trim settings
 * Each sample maintains its own trim bar positions for precise playback control
 */
export default class SoundSample {
    constructor(url, name, index) {
        this.url = url;
        this.name = name;
        this.index = index;
        
        // Audio data
        this.decodedBuffer = null;
        
        // Trim bar positions (in pixels, relative to waveform canvas)
        // Will be converted to time offsets during playback
        this.leftTrimPosition = 0;  // Start position in pixels
        this.rightTrimPosition = 0; // End position in pixels (will be set after load)
        
        // Playback settings (in seconds)
        this.startOffset = 0;  // Where to start playing in the buffer
        this.duration = 0;     // Duration of the trimmed section
        
        // Loading state
        this.loaded = false;
        this.loading = false;
        this.loadProgress = 0;
        this.error = null;
    }

    /**
     * Load and decode the sound with progress tracking
     * @param {AudioContext} audioContext - The Web Audio API context
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise<AudioBuffer>} The decoded audio buffer
     */
    async load(audioContext, progressCallback = null) {
        this.loading = true;
        this.error = null;

        try {
            const response = await fetch(this.url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('Content-Length');
            const total = parseInt(contentLength, 10);

            // Read stream in chunks for progress tracking
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                // Update progress
                this.loadProgress = total > 0 ? (receivedLength / total) * 100 : 0;
                
                if (progressCallback) {
                    progressCallback(this.index, this.loadProgress, receivedLength, total);
                }
            }

            // Merge chunks
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }

            // Decode audio
            this.decodedBuffer = await audioContext.decodeAudioData(allChunks.buffer);
            this.duration = this.decodedBuffer.duration;
            this.loaded = true;
            this.loading = false;
            this.loadProgress = 100;

            console.log(`✓ Sound ${this.name} loaded: ${this.duration.toFixed(2)}s`);
            
            return this.decodedBuffer;

        } catch (error) {
            console.error(`✗ Failed to load sound ${this.name}:`, error);
            this.error = error.message;
            this.loading = false;
            this.loaded = false;
            throw error;
        }
    }

    /**
     * Update trim bar positions (in pixels)
     * These will be converted to time offsets when playing
     * @param {number} leftX - Left trim bar position in pixels
     * @param {number} rightX - Right trim bar position in pixels
     * @param {number} canvasWidth - Width of the waveform canvas
     */
    setTrimPositions(leftX, rightX, canvasWidth) {
        this.leftTrimPosition = leftX;
        this.rightTrimPosition = rightX;
        
        // Convert pixel positions to time offsets
        if (this.decodedBuffer && canvasWidth > 0) {
            const totalDuration = this.decodedBuffer.duration;
            this.startOffset = (leftX / canvasWidth) * totalDuration;
            this.duration = ((rightX - leftX) / canvasWidth) * totalDuration;
        }
    }

    /**
     * Get current trim settings in seconds
     * @returns {Object} {startOffset, duration}
     */
    getTrimSettings() {
        return {
            startOffset: this.startOffset,
            duration: this.duration,
            leftPixel: this.leftTrimPosition,
            rightPixel: this.rightTrimPosition
        };
    }

    /**
     * Play the sound with trim settings applied
     * @param {AudioContext} audioContext - The Web Audio API context
     * @param {AudioNode} destination - Where to connect (default: audioContext.destination)
     */
    play(audioContext, destination = null) {
        if (!this.loaded || !this.decodedBuffer) {
            console.warn(`Sound ${this.name} is not loaded yet`);
            return null;
        }

        const source = audioContext.createBufferSource();
        source.buffer = this.decodedBuffer;
        
        // Connect to destination
        const target = destination || audioContext.destination;
        source.connect(target);
        
        // Apply trim settings
        // start(when, offset, duration)
        if (this.duration > 0 && this.duration < this.decodedBuffer.duration) {
            // Play trimmed portion
            source.start(0, this.startOffset, this.duration);
            console.log(`▶ Playing ${this.name} [${this.startOffset.toFixed(2)}s - ${(this.startOffset + this.duration).toFixed(2)}s]`);
        } else {
            // Play full sound
            source.start(0);
            console.log(`▶ Playing ${this.name} [full]`);
        }

        return source;
    }

    /**
     * Get the audio buffer
     * @returns {AudioBuffer|null}
     */
    getBuffer() {
        return this.decodedBuffer;
    }

    /**
     * Check if the sound is loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Check if the sound is currently loading
     * @returns {boolean}
     */
    isLoading() {
        return this.loading;
    }

    /**
     * Get load progress percentage
     * @returns {number} 0-100
     */
    getProgress() {
        return this.loadProgress;
    }

    /**
     * Get error message if any
     * @returns {string|null}
     */
    getError() {
        return this.error;
    }

    /**
     * Reset the sound sample to initial state
     */
    reset() {
        this.decodedBuffer = null;
        this.loaded = false;
        this.loading = false;
        this.loadProgress = 0;
        this.error = null;
        this.startOffset = 0;
        this.duration = 0;
        this.leftTrimPosition = 0;
        this.rightTrimPosition = 0;
    }
}
