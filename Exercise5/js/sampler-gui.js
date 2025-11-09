// Sampler GUI - Visual interface for the sampler engine
// Separated from engine for testability and flexibility

import SamplerEngine from './sampler-engine.js';

export default class SamplerGUI {
    constructor(engine) {
        this.engine = engine;
        this.pads = [];
        this.progressBars = [];
        this.gridContainer = document.querySelector('#sampler-grid');
        
        // Subscribe to engine events
        this.engine.onProgress((index, percentage) => {
            this.updateProgress(index, percentage);
        });

        this.engine.onStateChange((index, state, error) => {
            this.updatePadState(index, state, error);
        });
    }

    // Create 4x4 pad grid
    createPads() {
        this.gridContainer.innerHTML = '';
        
        // Create 16 pads (4x4 grid)
        // Layout: bottom to top, left to right
        for (let i = 0; i < 16; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.index = i;
            
            // Pad label (visual position)
            const label = document.createElement('div');
            label.className = 'pad-label';
            label.textContent = `PAD ${i + 1}`;
            
            // Progress bar
            const progressContainer = document.createElement('div');
            progressContainer.className = 'pad-progress-container';
            
            const progress = document.createElement('progress');
            progress.className = 'pad-progress';
            progress.max = 100;
            progress.value = 0;
            
            const progressText = document.createElement('span');
            progressText.className = 'pad-progress-text';
            progressText.textContent = '0%';
            
            progressContainer.appendChild(progress);
            progressContainer.appendChild(progressText);
            
            // Status indicator
            const status = document.createElement('div');
            status.className = 'pad-status';
            status.textContent = 'Empty';
            
            // Play button (initially disabled)
            const playBtn = document.createElement('button');
            playBtn.className = 'pad-play-btn';
            playBtn.textContent = '▶';
            playBtn.disabled = true;
            playBtn.onclick = (e) => {
                e.stopPropagation();
                this.engine.playSound(i);
                this.flashPad(i);
            };
            
            pad.appendChild(label);
            pad.appendChild(progressContainer);
            pad.appendChild(status);
            pad.appendChild(playBtn);
            
            // Click to play
            pad.onclick = () => {
                if (this.engine.isSoundLoaded(i)) {
                    this.engine.playSound(i);
                    this.flashPad(i);
                }
            };
            
            this.gridContainer.appendChild(pad);
            this.pads[i] = pad;
            this.progressBars[i] = { progress, progressText, status, playBtn };
        }
    }

    // Update progress bar for a pad
    updateProgress(index, percentage) {
        const { progress, progressText } = this.progressBars[index];
        progress.value = percentage;
        progressText.textContent = `${Math.round(percentage)}%`;
        
        // Update global progress
        this.updateGlobalProgress();
    }

    // Update pad state (empty, loading, loaded, error)
    updatePadState(index, state, error = null) {
        const pad = this.pads[index];
        const { status, playBtn, progress, progressText } = this.progressBars[index];
        
        // Remove all state classes
        pad.classList.remove('empty', 'loading', 'loaded', 'error');
        
        switch (state) {
            case 'empty':
                pad.classList.add('empty');
                status.textContent = 'Empty';
                playBtn.disabled = true;
                progress.value = 0;
                progressText.textContent = '0%';
                break;
                
            case 'loading':
                pad.classList.add('loading');
                status.textContent = 'Loading...';
                playBtn.disabled = true;
                break;
                
            case 'loaded':
                pad.classList.add('loaded');
                status.textContent = '✓ Ready';
                playBtn.disabled = false;
                progress.value = 100;
                progressText.textContent = '100%';
                break;
                
            case 'error':
                pad.classList.add('error');
                status.textContent = `✗ Error`;
                status.title = error || 'Failed to load';
                playBtn.disabled = true;
                break;
        }
    }

    // Flash animation when pad is played
    flashPad(index) {
        const pad = this.pads[index];
        pad.classList.add('playing');
        setTimeout(() => {
            pad.classList.remove('playing');
        }, 200);
    }

    // Update global progress bar
    updateGlobalProgress() {
        const globalProgress = document.querySelector('#globalProgress');
        const globalProgressText = document.querySelector('#globalProgressText');
        
        // Calculate average progress
        let totalProgress = 0;
        this.progressBars.forEach(({ progress }) => {
            totalProgress += parseFloat(progress.value) || 0;
        });
        
        const averageProgress = totalProgress / 16;
        globalProgress.value = averageProgress;
        globalProgressText.textContent = `${Math.round(averageProgress)}%`;
    }

    // Initialize MIDI support
    async initMIDI() {
        try {
            const midiSelect = document.querySelector('#midiSelect');
            
            if (!navigator.requestMIDIAccess) {
                console.warn('Web MIDI API not supported in this browser');
                return;
            }

            const midiAccess = await navigator.requestMIDIAccess();
            const inputs = Array.from(midiAccess.inputs.values());

            if (inputs.length === 0) {
                midiSelect.innerHTML = '<option>No MIDI devices found</option>';
                return;
            }

            // Populate dropdown
            midiSelect.innerHTML = '<option value="">Select MIDI device...</option>';
            inputs.forEach(input => {
                const option = document.createElement('option');
                option.value = input.id;
                option.textContent = input.name;
                midiSelect.appendChild(option);
            });

            midiSelect.disabled = false;

            // Handle MIDI device selection
            midiSelect.onchange = () => {
                const selectedId = midiSelect.value;
                if (!selectedId) return;

                const input = inputs.find(i => i.id === selectedId);
                if (input) {
                    this.connectMIDIDevice(input);
                }
            };

            console.log(`Found ${inputs.length} MIDI device(s)`);

        } catch (error) {
            console.error('MIDI initialization failed:', error);
        }
    }

    // Connect MIDI device and map to pads
    connectMIDIDevice(input) {
        input.onmidimessage = (event) => {
            const [command, note, velocity] = event.data;

            // Note On (command 144 = 0x90)
            if (command === 144 && velocity > 0) {
                // Map MIDI notes 36-51 to pads 0-15
                const padIndex = note - 36;
                
                if (padIndex >= 0 && padIndex < 16) {
                    this.engine.playSound(padIndex);
                    this.flashPad(padIndex);
                }
            }
        };

        console.log(`Connected to MIDI device: ${input.name}`);
    }
}
