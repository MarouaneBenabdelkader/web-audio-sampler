/**
 * Utility functions for the sampler
 */

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert pixel position to seconds in audio buffer
 * @param {number} x - Pixel position
 * @param {number} bufferDuration - Total duration in seconds
 * @param {number} canvasWidth - Canvas width in pixels
 * @returns {number} Time in seconds
 */
function pixelToSeconds(x, bufferDuration, canvasWidth) {
    return (x / canvasWidth) * bufferDuration;
}

/**
 * Convert seconds to pixel position
 * @param {number} seconds - Time in seconds
 * @param {number} bufferDuration - Total duration in seconds
 * @param {number} canvasWidth - Canvas width in pixels
 * @returns {number} Pixel position
 */
function secondsToPixel(seconds, bufferDuration, canvasWidth) {
    return (seconds / bufferDuration) * canvasWidth;
}

/**
 * Get mouse position relative to canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {MouseEvent} event - Mouse event
 * @returns {Object} {x, y} coordinates
 */
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format time in seconds to MM:SS.mmm
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { 
    distance, 
    pixelToSeconds, 
    secondsToPixel,
    getMousePos, 
    clamp, 
    formatTime,
    formatBytes
};
