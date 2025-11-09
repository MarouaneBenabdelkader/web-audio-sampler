/**
 * SamplerGUI Class
 * Visual interface for the Sampler Engine
 * Integrates pad grid, waveform visualization, and trim bars
 * 
 * Design: Separated from engine for testability
 * Can be swapped with different UIs or headless operation
 */
import WaveformDrawer from './WaveformDrawer.js';
import TrimbarsDrawer from './TrimbarsDrawer.js';
import { getMousePos, formatTime } from './utils.js';

export default class SamplerGUI {
    constructor(engine) {
        this.engine = engine;
        this.pads = [];
        this.currentPadIndex = 0; // Currently selected pad for waveform display
        
        // DOM elements
        this.gridContainer = document.querySelector('#sampler-grid');
        this.waveformCanvas = document.querySelector('#waveform-canvas');
        this.trimCanvas = document.querySelector('#trim-canvas');
        this.infoDisplay = document.querySelector('#info-display');
        
        // Waveform and trim bars
        this.waveformDrawer = new WaveformDrawer();
        this.trimDrawer = null;
        
        // MIDI
        this.midiAccess = null;
        this.midiInputs = [];
        this.selectedMidiInput = null;
        
        // Animation frame for trim bar drawing
        this.animationId = null;
        
        // Subscribe to engine events
        this.setupEngineListeners();
    }

    /**
     * Setup event listeners from engine
     */
    setupEngineListeners() {
        this.engine.onProgress((index, percentage, loaded, total) => {
            this.updateProgress(index, percentage, loaded, total);
        });

        this.engine.onStateChange((index, state, error) => {
            this.updatePadState(index, state, error);
        });

        this.engine.onPlay((index) => {
            this.flashPad(index);
        });
    }

    // ==================== Pad Grid Management ====================

    /**
     * Create the 4x4 pad grid
     */
    createPads() {
        this.gridContainer.innerHTML = '';
        
        for (let i = 0; i < this.engine.padCount; i++) {
            const pad = this.createPad(i);
            this.pads.push(pad);
            this.gridContainer.appendChild(pad);
        }
    }

    /**
     * Create a single pad element
     * @param {number} index - Pad index
     * @returns {HTMLElement}
     */
    createPad(index) {
        const pad = document.createElement('div');
        pad.className = 'pad pad-empty';
        pad.dataset.index = index;
        
        // Pad number label
        const label = document.createElement('div');
        label.className = 'pad-label';
        label.textContent = `${index + 1}`;
        
        // Sample name
        const name = document.createElement('div');
        name.className = 'pad-name';
        name.textContent = 'Empty';
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'pad-progress-container';
        
        const progress = document.createElement('progress');
        progress.className = 'pad-progress';
        progress.max = 100;
        progress.value = 0;
        
        const progressText = document.createElement('span');
        progressText.className = 'pad-progress-text';
        progressText.textContent = '';
        
        progressContainer.appendChild(progress);
        progressContainer.appendChild(progressText);
        
        // Status indicator
        const status = document.createElement('div');
        status.className = 'pad-status';
        
        // Assemble pad
        pad.appendChild(label);
        pad.appendChild(name);
        pad.appendChild(progressContainer);
        pad.appendChild(status);
        
        // Click handlers
        pad.addEventListener('click', () => this.handlePadClick(index));
        
        return pad;
    }

    /**
     * Handle pad click
     * @param {number} index
     */
    handlePadClick(index) {
        const sample = this.engine.getSample(index);
        
        if (sample && sample.isLoaded()) {
            // Play sound
            this.engine.playSound(index);
            
            // Switch to this pad's waveform
            this.switchToPad(index);
        }
    }

    /**
     * Switch waveform display to a different pad
     * @param {number} index
     */
    switchToPad(index) {
        const sample = this.engine.getSample(index);
        
        if (!sample || !sample.isLoaded()) {
            console.warn(`Cannot switch to pad ${index}: not loaded`);
            return;
        }

        // Stop previous animation
        this.stopTrimAnimation();
        
        // Clear both canvases
        this.clearCanvases();

        // Update current pad
        this.currentPadIndex = index;
        
        // Highlight active pad
        this.pads.forEach((pad, i) => {
            if (i === index) {
                pad.classList.add('pad-active');
            } else {
                pad.classList.remove('pad-active');
            }
        });

        // Draw waveform first
        this.drawWaveform(sample);
        
        // Then setup trim bars on top
        this.setupTrimBars(sample);
        
        // Update info display
        this.updateInfo(sample);
    }
    
    /**
     * Clear both waveform and trim canvases
     */
    clearCanvases() {
        // Clear waveform canvas
        if (this.waveformCanvas) {
            const ctx = this.waveformCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        }
        
        // Clear trim canvas
        if (this.trimCanvas) {
            const ctx = this.trimCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.trimCanvas.width, this.trimCanvas.height);
        }
        
        // Clear trim drawer reference
        this.trimDrawer = null;
    }

    /**
     * Update pad progress bar
     * @param {number} index
     * @param {number} percentage
     * @param {number} loaded
     * @param {number} total
     */
    updateProgress(index, percentage, loaded, total) {
        const pad = this.pads[index];
        if (!pad) return;

        const progressBar = pad.querySelector('.pad-progress');
        const progressText = pad.querySelector('.pad-progress-text');

        progressBar.value = percentage;
        
        if (percentage > 0 && percentage < 100) {
            progressText.textContent = `${Math.round(percentage)}%`;
        } else {
            progressText.textContent = '';
        }
    }

    /**
     * Update pad visual state
     * @param {number} index
     * @param {string} state - 'empty', 'loading', 'loaded', 'error'
     * @param {string} error - Error message if state is 'error'
     */
    updatePadState(index, state, error = null) {
        const pad = this.pads[index];
        if (!pad) return;

        const nameEl = pad.querySelector('.pad-name');
        const statusEl = pad.querySelector('.pad-status');
        const sample = this.engine.getSample(index);

        // Remove all state classes
        pad.classList.remove('pad-empty', 'pad-loading', 'pad-loaded', 'pad-error');
        
        // Add new state class
        pad.classList.add(`pad-${state}`);

        // Update text
        switch (state) {
            case 'empty':
                nameEl.textContent = 'Empty';
                statusEl.textContent = '';
                break;
                
            case 'loading':
                nameEl.textContent = sample ? sample.name : 'Loading...';
                statusEl.textContent = '⏳';
                break;
                
            case 'loaded':
                nameEl.textContent = sample ? sample.name : 'Loaded';
                statusEl.textContent = '✓';
                break;
                
            case 'error':
                nameEl.textContent = 'Error';
                statusEl.textContent = '✗';
                statusEl.title = error || 'Load failed';
                break;
        }
    }

    /**
     * Flash pad when played
     * @param {number} index
     */
    flashPad(index) {
        const pad = this.pads[index];
        if (!pad) return;

        pad.classList.add('pad-playing');
        setTimeout(() => {
            pad.classList.remove('pad-playing');
        }, 200);
    }

    // ==================== Waveform Visualization ====================

    /**
     * Draw waveform for a sample
     * @param {SoundSample} sample
     */
    drawWaveform(sample) {
        if (!sample || !sample.isLoaded()) return;

        const buffer = sample.getBuffer();
        
        // Clear waveform canvas before drawing
        const ctx = this.waveformCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        
        // Initialize and draw waveform
        this.waveformDrawer.init(buffer, this.waveformCanvas);
        this.waveformDrawer.drawWave();
    }

    // ==================== Trim Bars ====================

    /**
     * Setup trim bars for a sample
     * @param {SoundSample} sample
     */
    setupTrimBars(sample) {
        // Get existing trim positions or use defaults
        const trimSettings = sample.getTrimSettings();
        const leftX = trimSettings.leftPixel || 0;
        const rightX = trimSettings.rightPixel || this.trimCanvas.width;

        // Create new trim drawer
        this.trimDrawer = new TrimbarsDrawer(this.trimCanvas, leftX, rightX);

        // Setup mouse interaction
        this.setupTrimBarInteraction();

        // Start animation loop
        this.startTrimAnimation();
    }

    /**
     * Setup mouse interaction for trim bars
     */
    setupTrimBarInteraction() {
        const canvas = this.trimCanvas;

        canvas.addEventListener('mousemove', (e) => {
            if (!this.trimDrawer) return;
            
            const mousePos = getMousePos(canvas, e);
            this.trimDrawer.moveTrimBars(mousePos);
            
            // Update cursor
            if (this.trimDrawer.isDragging()) {
                canvas.style.cursor = 'ew-resize';
            } else {
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('mousedown', (e) => {
            if (!this.trimDrawer) return;
            this.trimDrawer.startDrag();
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!this.trimDrawer) return;
            this.trimDrawer.stopDrag();
            
            // Update engine with new trim positions
            const positions = this.trimDrawer.getTrimPositions();
            this.engine.updateTrimBars(
                this.currentPadIndex,
                positions.left,
                positions.right,
                canvas.width
            );
            
            // Update info display
            const sample = this.engine.getSample(this.currentPadIndex);
            if (sample) {
                this.updateInfo(sample);
            }
        });

        canvas.addEventListener('mouseleave', () => {
            if (this.trimDrawer) {
                this.trimDrawer.stopDrag();
            }
        });
    }

    /**
     * Start animation loop for trim bars
     */
    startTrimAnimation() {
        const animate = () => {
            if (this.trimDrawer) {
                this.trimDrawer.draw();
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * Stop trim animation
     */
    stopTrimAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // ==================== Info Display ====================

    /**
     * Update info display with sample details
     * @param {SoundSample} sample
     */
    updateInfo(sample) {
        if (!this.infoDisplay || !sample) return;

        const buffer = sample.getBuffer();
        const trimSettings = sample.getTrimSettings();

        const info = `
            <strong>${sample.name}</strong><br>
            Duration: ${formatTime(buffer.duration)}<br>
            Channels: ${buffer.numberOfChannels}<br>
            Sample Rate: ${buffer.sampleRate} Hz<br>
            <hr>
            <strong>Trim Settings:</strong><br>
            Start: ${formatTime(trimSettings.startOffset)}<br>
            Duration: ${formatTime(trimSettings.duration)}<br>
            End: ${formatTime(trimSettings.startOffset + trimSettings.duration)}
        `;

        this.infoDisplay.innerHTML = info;
    }

    // ==================== MIDI Integration ====================

    /**
     * Setup MIDI support
     */
    async setupMIDI() {
        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            console.log('🎹 MIDI Access granted');
            
            this.updateMIDIDeviceList();
            
            // Listen for device changes
            this.midiAccess.onstatechange = () => {
                this.updateMIDIDeviceList();
            };
            
        } catch (error) {
            console.warn('MIDI not available:', error);
        }
    }

    /**
     * Update MIDI device list
     */
    updateMIDIDeviceList() {
        this.midiInputs = [];
        
        for (const input of this.midiAccess.inputs.values()) {
            this.midiInputs.push(input);
        }

        console.log(`Found ${this.midiInputs.length} MIDI input(s)`);
        
        // Auto-select first device
        if (this.midiInputs.length > 0 && !this.selectedMidiInput) {
            this.selectMIDIInput(0);
        }
    }

    /**
     * Select a MIDI input device
     * @param {number} index - Index in midiInputs array
     */
    selectMIDIInput(index) {
        // Disconnect previous
        if (this.selectedMidiInput) {
            this.selectedMidiInput.onmidimessage = null;
        }

        this.selectedMidiInput = this.midiInputs[index];
        
        if (this.selectedMidiInput) {
            console.log(`🎹 Selected: ${this.selectedMidiInput.name}`);
            
            // Setup message handler
            this.selectedMidiInput.onmidimessage = (event) => {
                this.handleMIDIMessage(event);
            };
        }
    }

    /**
     * Handle incoming MIDI message
     * @param {MIDIMessageEvent} event
     */
    handleMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        
        // Note On (144 = 0x90)
        if (command === 144 && velocity > 0) {
            this.engine.playByMidiNote(note);
        }
        
        // Note Off (128 = 0x80) - could be used for sample stopping if implemented
    }

    /**
     * Get MIDI device list
     * @returns {Array} MIDI input devices
     */
    getMIDIDevices() {
        return this.midiInputs.map((input, index) => ({
            index,
            name: input.name,
            manufacturer: input.manufacturer,
            selected: input === this.selectedMidiInput
        }));
    }

    // ==================== Initialization ====================

    /**
     * Initialize the GUI
     */
    async init() {
        // Create pad grid
        this.createPads();
        
        // Setup MIDI
        await this.setupMIDI();
        
        console.log('🎨 SamplerGUI initialized');
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopTrimAnimation();
        
        if (this.selectedMidiInput) {
            this.selectedMidiInput.onmidimessage = null;
        }
    }
}
