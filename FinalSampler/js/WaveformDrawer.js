/**
 * WaveformDrawer Class
 * Draws audio waveform visualization in a canvas
 * Optimized for performance with sample stepping
 */
export default class WaveformDrawer {
    constructor() {
        this.decodedAudioBuffer = null;
        this.peaks = [];
        this.canvas = null;
        this.ctx = null;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.color = '#00ff88';
        this.sampleStep = null;
    }

    /**
     * Initialize the waveform drawer
     * @param {AudioBuffer} decodedAudioBuffer - Decoded audio buffer
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} color - Waveform color (optional)
     * @param {number} sampleStep - Sample stepping for optimization (optional)
     */
    init(decodedAudioBuffer, canvas, color = '#00ff88', sampleStep = null) {
        this.decodedAudioBuffer = decodedAudioBuffer;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.displayWidth = canvas.width;
        this.displayHeight = canvas.height;
        this.color = color;
        this.sampleStep = sampleStep;

        // Compute peaks from audio buffer
        this.getPeaks();
    }

    /**
     * Find maximum value in an array
     * @param {Array} values - Array of values
     * @returns {number} Maximum value
     */
    max(values) {
        let max = -Infinity;
        for (let i = 0, len = values.length; i < len; i++) {
            if (values[i] > max) {
                max = values[i];
            }
        }
        return max;
    }

    /**
     * Extract peaks from audio buffer for visualization
     * Optimized to match canvas width and reduce processing
     */
    getPeaks() {
        // Get raw audio data (use first channel for mono or stereo)
        const channelData = this.decodedAudioBuffer.getChannelData(0);
        const totalSamples = channelData.length;

        // How many samples per pixel
        const sampleSize = Math.floor(totalSamples / this.displayWidth);
        
        // Step through samples (skip some for performance)
        // If not specified, use 1/10 of sampleSize
        const step = this.sampleStep || Math.max(1, Math.floor(sampleSize / 10));

        this.peaks = [];

        // For each pixel on the canvas
        for (let i = 0; i < this.displayWidth; i++) {
            const start = Math.floor(i * sampleSize);
            const end = Math.floor(start + sampleSize);
            
            let peak = 0;

            // Find the maximum absolute value in this sample range
            for (let j = start; j < end && j < totalSamples; j += step) {
                const val = Math.abs(channelData[j]);
                if (val > peak) {
                    peak = val;
                }
            }

            this.peaks.push(peak);
        }
    }

    /**
     * Draw the waveform
     * @param {number} startY - Vertical start position in canvas
     * @param {number} height - Height of the waveform
     */
    drawWave(startY = 0, height = null) {
        if (!this.canvas || !this.peaks.length) {
            console.warn('WaveformDrawer not initialized or no peaks');
            return;
        }

        const h = height || this.displayHeight;
        const ctx = this.ctx;

        // Clear canvas first
        ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

        ctx.save();
        ctx.translate(0, startY);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        // Scaling coefficient to fit waveform in height
        const maxPeak = this.max(this.peaks);
        const scale = maxPeak > 0 ? h / (2 * maxPeak) : 0;
        const halfHeight = h / 2;

        // Draw each peak as a vertical line
        for (let i = 0; i < this.peaks.length; i++) {
            const scaledPeak = this.peaks[i] * scale;

            // Draw from center outward (symmetrical)
            ctx.fillRect(i, halfHeight - scaledPeak, 1, scaledPeak * 2);
        }

        ctx.restore();
    }

    /**
     * Clear the canvas
     */
    clear() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        }
    }

    /**
     * Update color
     * @param {string} newColor - New color for waveform
     */
    setColor(newColor) {
        this.color = newColor;
    }

    /**
     * Get peaks array (for external use)
     * @returns {Array} Array of peak values
     */
    getPeaksArray() {
        return this.peaks;
    }
}
