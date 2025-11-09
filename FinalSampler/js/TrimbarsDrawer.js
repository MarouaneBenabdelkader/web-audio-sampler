/**
 * TrimbarsDrawer Class
 * Manages draggable trim bars for audio sample trimming
 * Allows user to select a portion of the audio to play
 */
import { distance } from './utils.js';

export default class TrimbarsDrawer {
    constructor(canvas, leftTrimBarX = 0, rightTrimBarX = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Right trim bar defaults to canvas width if not specified
        const rightX = rightTrimBarX !== null ? rightTrimBarX : canvas.width;

        // Left trim bar
        this.leftTrimBar = {
            x: leftTrimBarX,
            color: 'white',
            selected: false,
            dragged: false
        };

        // Right trim bar
        this.rightTrimBar = {
            x: rightX,
            color: 'white',
            selected: false,
            dragged: false
        };
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw the trim bars and shaded regions
     */
    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Clear canvas first to remove previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw shaded regions outside trim bars (semi-transparent)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.leftTrimBar.x, this.canvas.height);
        ctx.fillRect(this.rightTrimBar.x, 0, this.canvas.width - this.rightTrimBar.x, this.canvas.height);

        // Draw vertical lines for trim bars
        ctx.lineWidth = 2;

        // Left trim bar line
        ctx.strokeStyle = this.leftTrimBar.color;
        ctx.beginPath();
        ctx.moveTo(this.leftTrimBar.x, 0);
        ctx.lineTo(this.leftTrimBar.x, this.canvas.height);
        ctx.stroke();

        // Right trim bar line
        ctx.strokeStyle = this.rightTrimBar.color;
        ctx.beginPath();
        ctx.moveTo(this.rightTrimBar.x, 0);
        ctx.lineTo(this.rightTrimBar.x, this.canvas.height);
        ctx.stroke();

        // Draw triangular handles for grab points
        // Left triangle (pointing right)
        ctx.fillStyle = this.leftTrimBar.color;
        ctx.beginPath();
        ctx.moveTo(this.leftTrimBar.x, 0);
        ctx.lineTo(this.leftTrimBar.x + 10, 8);
        ctx.lineTo(this.leftTrimBar.x, 16);
        ctx.closePath();
        ctx.fill();

        // Right triangle (pointing left)
        ctx.fillStyle = this.rightTrimBar.color;
        ctx.beginPath();
        ctx.moveTo(this.rightTrimBar.x, 0);
        ctx.lineTo(this.rightTrimBar.x - 10, 8);
        ctx.lineTo(this.rightTrimBar.x, 16);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Highlight trim bars when mouse is close
     * Changes color to red when nearby
     * @param {Object} mousePos - {x, y} mouse position
     */
    highlightTrimBarsWhenClose(mousePos) {
        // Check distance to left trim bar
        const distToLeft = distance(mousePos.x, mousePos.y, this.leftTrimBar.x + 5, 8);

        // Highlight left bar if close and right bar not selected
        if (distToLeft < 15 && !this.rightTrimBar.selected) {
            this.leftTrimBar.color = 'red';
            this.leftTrimBar.selected = true;
        } else if (!this.leftTrimBar.dragged) {
            this.leftTrimBar.color = 'white';
            this.leftTrimBar.selected = false;
        }

        // Check distance to right trim bar
        const distToRight = distance(mousePos.x, mousePos.y, this.rightTrimBar.x - 5, 8);

        // Highlight right bar if close and left bar not selected
        if (distToRight < 15 && !this.leftTrimBar.selected) {
            this.rightTrimBar.color = 'red';
            this.rightTrimBar.selected = true;
        } else if (!this.rightTrimBar.dragged) {
            this.rightTrimBar.color = 'white';
            this.rightTrimBar.selected = false;
        }
    }

    /**
     * Start dragging selected trim bar
     */
    startDrag() {
        if (this.leftTrimBar.selected) {
            this.leftTrimBar.dragged = true;
        }
        if (this.rightTrimBar.selected) {
            this.rightTrimBar.dragged = true;
        }
    }

    /**
     * Stop dragging trim bars
     * Ensures trim bars stay in valid positions
     */
    stopDrag() {
        if (this.leftTrimBar.dragged) {
            this.leftTrimBar.dragged = false;
            this.leftTrimBar.selected = false;

            // Ensure left bar stays left of right bar
            if (this.leftTrimBar.x > this.rightTrimBar.x) {
                this.leftTrimBar.x = this.rightTrimBar.x;
            }
        }

        if (this.rightTrimBar.dragged) {
            this.rightTrimBar.dragged = false;
            this.rightTrimBar.selected = false;

            // Ensure right bar stays right of left bar
            if (this.rightTrimBar.x < this.leftTrimBar.x) {
                this.rightTrimBar.x = this.leftTrimBar.x;
            }
        }
    }

    /**
     * Move trim bars based on mouse position
     * @param {Object} mousePos - {x, y} mouse position
     */
    moveTrimBars(mousePos) {
        // Highlight trim bars if mouse is close
        this.highlightTrimBarsWhenClose(mousePos);

        // Constrain to canvas bounds
        const clampedX = Math.max(0, Math.min(mousePos.x, this.canvas.width));

        // Move left trim bar if being dragged
        if (this.leftTrimBar.dragged) {
            // Don't allow moving past right trim bar
            if (clampedX <= this.rightTrimBar.x) {
                this.leftTrimBar.x = clampedX;
            }
        }

        // Move right trim bar if being dragged
        if (this.rightTrimBar.dragged) {
            // Don't allow moving past left trim bar
            if (clampedX >= this.leftTrimBar.x) {
                this.rightTrimBar.x = clampedX;
            }
        }
    }

    /**
     * Get current trim bar positions
     * @returns {Object} {left, right} positions in pixels
     */
    getTrimPositions() {
        return {
            left: this.leftTrimBar.x,
            right: this.rightTrimBar.x
        };
    }

    /**
     * Set trim bar positions programmatically
     * @param {number} leftX - Left trim bar position
     * @param {number} rightX - Right trim bar position
     */
    setTrimPositions(leftX, rightX) {
        this.leftTrimBar.x = Math.max(0, Math.min(leftX, this.canvas.width));
        this.rightTrimBar.x = Math.max(0, Math.min(rightX, this.canvas.width));

        // Ensure valid order
        if (this.leftTrimBar.x > this.rightTrimBar.x) {
            [this.leftTrimBar.x, this.rightTrimBar.x] = [this.rightTrimBar.x, this.leftTrimBar.x];
        }
    }

    /**
     * Reset trim bars to full range
     */
    reset() {
        this.leftTrimBar.x = 0;
        this.rightTrimBar.x = this.canvas.width;
        this.leftTrimBar.selected = false;
        this.rightTrimBar.selected = false;
        this.leftTrimBar.dragged = false;
        this.rightTrimBar.dragged = false;
    }

    /**
     * Check if any trim bar is being dragged
     * @returns {boolean}
     */
    isDragging() {
        return this.leftTrimBar.dragged || this.rightTrimBar.dragged;
    }
}
