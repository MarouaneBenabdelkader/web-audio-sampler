/**
 * SamplerEngine Class
 * Headless audio processing engine - works without GUI
 * Manages multiple sound samples with loading, playback, and MIDI support
 * 
 * Design Pattern: Facade + Observer
 * - Facade: Simple interface for complex audio operations
 * - Observer: Event-based communication with GUI (or other listeners)
 */
import SoundSample from './SoundSample.js';

export default class SamplerEngine {
    constructor(padCount = 16) {
        this.audioContext = null;
        this.samples = new Array(padCount).fill(null);
        this.padCount = padCount;
        
        // Event callbacks (Observer pattern)
        this.progressCallbacks = [];
        this.stateCallbacks = [];
        this.playCallbacks = [];
        
        // Master volume
        this.masterGain = null;
        this.volume = 1.0;
    }

    /**
     * Initialize the audio context and master gain
     * @returns {AudioContext}
     */
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('🎵 SamplerEngine initialized');
        }
        return this.audioContext;
    }

    // ==================== Event Management (Observer Pattern) ====================

    /**
     * Subscribe to progress updates
     * @param {Function} callback - (index, percentage, loaded, total) => void
     */
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - (index, state, error) => void
     * States: 'empty', 'loading', 'loaded', 'error'
     */
    onStateChange(callback) {
        this.stateCallbacks.push(callback);
    }

    /**
     * Subscribe to playback events
     * @param {Function} callback - (index) => void
     */
    onPlay(callback) {
        this.playCallbacks.push(callback);
    }

    /**
     * Emit progress event
     */
    emitProgress(index, percentage, loaded, total) {
        this.progressCallbacks.forEach(cb => cb(index, percentage, loaded, total));
    }

    /**
     * Emit state change event
     */
    emitStateChange(index, state, error = null) {
        this.stateCallbacks.forEach(cb => cb(index, state, error));
    }

    /**
     * Emit play event
     */
    emitPlay(index) {
        this.playCallbacks.forEach(cb => cb(index));
    }

    // ==================== Sound Loading ====================

    /**
     * Load a single sound sample
     * @param {string} url - URL of the sound file
     * @param {number} index - Pad index (0-15)
     * @param {string} name - Optional name for the sample
     * @returns {Promise<SoundSample>}
     */
    async loadSound(url, index, name = null) {
        this.init();

        // Create sound sample
        const sampleName = name || `Sample ${index + 1}`;
        const sample = new SoundSample(url, sampleName, index);
        this.samples[index] = sample;

        this.emitStateChange(index, 'loading');

        try {
            // Load with progress callback
            await sample.load(this.audioContext, (idx, progress, loaded, total) => {
                this.emitProgress(idx, progress, loaded, total);
            });

            this.emitStateChange(index, 'loaded');
            console.log(`✓ Loaded: ${sampleName}`);
            
            return sample;

        } catch (error) {
            this.emitStateChange(index, 'error', error.message);
            console.error(`✗ Failed: ${sampleName}`, error);
            throw error;
        }
    }

    /**
     * Load multiple sounds (fault-tolerant with Promise.allSettled)
     * @param {Array} soundConfigs - Array of {url, name} objects
     * @returns {Promise<Object>} Load summary
     */
    async loadAll(soundConfigs) {
        this.init();

        const promises = soundConfigs.map((config, index) => {
            if (index >= this.padCount) {
                console.warn(`Skipping index ${index}, exceeds pad count`);
                return Promise.resolve();
            }
            return this.loadSound(config.url, index, config.name);
        });

        const results = await Promise.allSettled(promises);

        // Generate summary
        const summary = {
            total: results.length,
            loaded: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            results: results
        };

        console.log('📊 Load Summary:', summary);
        return summary;
    }

    /**
     * Load sounds from a preset (REST API integration)
     * @param {Object} preset - Preset object with sounds array
     * @returns {Promise<Object>} Load summary
     */
    async loadPreset(preset) {
        console.log(`🎹 Loading preset: ${preset.name}`);
        
        // Clear existing samples
        this.clearAll();

        // Map preset sounds to sample configs
        const soundConfigs = preset.sounds.map(sound => ({
            url: sound.url,
            name: sound.name
        }));

        return this.loadAll(soundConfigs);
    }

    // ==================== Playback ====================

    /**
     * Play a sound by index
     * @param {number} index - Pad index
     */
    playSound(index) {
        if (index < 0 || index >= this.padCount) {
            console.warn(`Invalid index: ${index}`);
            return;
        }

        const sample = this.samples[index];

        if (!sample || !sample.isLoaded()) {
            console.warn(`No sound loaded at pad ${index}`);
            return;
        }

        // Play through master gain
        sample.play(this.audioContext, this.masterGain);
        this.emitPlay(index);
    }

    /**
     * Play a sound by MIDI note number
     * Maps MIDI notes 36-51 (or custom range) to pads
     * @param {number} midiNote - MIDI note number (0-127)
     */
    playByMidiNote(midiNote, baseNote = 36) {
        const padIndex = midiNote - baseNote;
        
        if (padIndex >= 0 && padIndex < this.padCount) {
            this.playSound(padIndex);
        }
    }

    // ==================== Trim Bar Management ====================

    /**
     * Update trim settings for a sample
     * @param {number} index - Sample index
     * @param {number} leftX - Left trim position (pixels)
     * @param {number} rightX - Right trim position (pixels)
     * @param {number} canvasWidth - Canvas width for conversion
     */
    updateTrimBars(index, leftX, rightX, canvasWidth) {
        const sample = this.samples[index];
        
        if (sample && sample.isLoaded()) {
            sample.setTrimPositions(leftX, rightX, canvasWidth);
            console.log(`✂️ Trim updated for pad ${index}:`, sample.getTrimSettings());
        }
    }

    /**
     * Get trim settings for a sample
     * @param {number} index - Sample index
     * @returns {Object|null} Trim settings
     */
    getTrimSettings(index) {
        const sample = this.samples[index];
        return sample && sample.isLoaded() ? sample.getTrimSettings() : null;
    }

    // ==================== Sample Management ====================

    /**
     * Get a sample by index
     * @param {number} index
     * @returns {SoundSample|null}
     */
    getSample(index) {
        return this.samples[index];
    }

    /**
     * Check if a sample is loaded
     * @param {number} index
     * @returns {boolean}
     */
    isSampleLoaded(index) {
        const sample = this.samples[index];
        return sample && sample.isLoaded();
    }

    /**
     * Get number of loaded samples
     * @returns {number}
     */
    getLoadedCount() {
        return this.samples.filter(s => s && s.isLoaded()).length;
    }

    /**
     * Clear all samples
     */
    clearAll() {
        for (let i = 0; i < this.padCount; i++) {
            if (this.samples[i]) {
                this.samples[i].reset();
            }
            this.samples[i] = null;
            this.emitStateChange(i, 'empty');
            this.emitProgress(i, 0, 0, 100);
        }
        console.log('🗑️ All samples cleared');
    }

    /**
     * Clear a single sample
     * @param {number} index
     */
    clearSample(index) {
        if (this.samples[index]) {
            this.samples[index].reset();
            this.samples[index] = null;
            this.emitStateChange(index, 'empty');
            this.emitProgress(index, 0, 0, 100);
        }
    }

    // ==================== Volume Control ====================

    /**
     * Set master volume
     * @param {number} volume - 0.0 to 1.0
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Get current volume
     * @returns {number} 0.0 to 1.0
     */
    getVolume() {
        return this.volume;
    }

    // ==================== Utility ====================

    /**
     * Get engine status
     * @returns {Object} Engine information
     */
    getStatus() {
        return {
            initialized: this.audioContext !== null,
            padCount: this.padCount,
            loadedSamples: this.getLoadedCount(),
            volume: this.volume,
            sampleRate: this.audioContext ? this.audioContext.sampleRate : null,
            state: this.audioContext ? this.audioContext.state : 'not initialized'
        };
    }

    /**
     * Resume audio context (needed for autoplay policies)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('▶️ Audio context resumed');
        }
    }
}
