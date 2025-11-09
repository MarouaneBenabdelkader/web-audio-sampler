/**
 * Main Application
 * Connects SamplerEngine and SamplerGUI
 * Handles preset loading from REST API
 */
import SamplerEngine from './SamplerEngine.js';
import SamplerGUI from './SamplerGUI.js';

// Global instances for console access
let engine, gui;

// REST API configuration
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch available presets from server
 * @returns {Promise<Array>} Array of presets
 */
async function fetchPresets() {
    try {
        const response = await fetch(`${API_BASE_URL}/presets`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const presets = await response.json();
        console.log('📋 Fetched presets:', presets);
        return presets;
        
    } catch (error) {
        console.error('Failed to fetch presets:', error);
        throw error;
    }
}

/**
 * Fetch a specific preset by ID
 * @param {number} id - Preset ID
 * @returns {Promise<Object>} Preset object
 */
async function fetchPreset(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/presets/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const preset = await response.json();
        console.log(`📋 Fetched preset ${id}:`, preset);
        return preset;
        
    } catch (error) {
        console.error(`Failed to fetch preset ${id}:`, error);
        throw error;
    }
}

/**
 * Populate preset dropdown menu
 * @param {Array} presets - Array of presets
 */
function populatePresetDropdown(presets) {
    const dropdown = document.querySelector('#preset-select');
    
    // Clear existing options
    dropdown.innerHTML = '<option value="">-- Select Preset --</option>';
    
    // Add preset options
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        dropdown.appendChild(option);
    });
}

/**
 * Handle preset selection
 * @param {number} presetId - Selected preset ID
 */
async function loadPresetById(presetId) {
    try {
        // Show loading state
        updateStatus('Loading preset...', 'loading');
        
        // Fetch preset details
        const preset = await fetchPreset(presetId);
        
        // Load into engine
        const summary = await engine.loadPreset(preset);
        
        // Update status
        updateStatus(
            `Loaded ${summary.loaded}/${summary.total} sounds`,
            summary.failed > 0 ? 'warning' : 'success'
        );
        
        // Auto-select first loaded pad for waveform display
        setTimeout(() => {
            const firstLoadedIndex = engine.samples.findIndex(s => s && s.isLoaded());
            if (firstLoadedIndex >= 0) {
                gui.switchToPad(firstLoadedIndex);
            }
        }, 500);
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Update status message
 * @param {string} message - Status message
 * @param {string} type - 'loading', 'success', 'warning', 'error'
 */
function updateStatus(message, type = 'info') {
    const statusEl = document.querySelector('#status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
}

/**
 * Setup UI event handlers
 */
function setupUI() {
    // Preset dropdown
    const presetDropdown = document.querySelector('#preset-select');
    presetDropdown.addEventListener('change', (e) => {
        const presetId = parseInt(e.target.value);
        if (presetId) {
            loadPresetById(presetId);
        }
    });
    
    // Clear button
    const clearBtn = document.querySelector('#clear-btn');
    clearBtn.addEventListener('click', () => {
        engine.clearAll();
        updateStatus('Cleared all samples', 'info');
    });
    
    // Volume slider
    const volumeSlider = document.querySelector('#volume-slider');
    const volumeValue = document.querySelector('#volume-value');
    
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        engine.setVolume(volume);
        volumeValue.textContent = Math.round(volume * 100) + '%';
    });
    
    // Resume audio context on user interaction (autoplay policy)
    document.addEventListener('click', () => {
        engine.resume();
    }, { once: true });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboard() {
    // Map keyboard keys to pads
    // Q W E R
    // A S D F
    // Z X C V
    // 1 2 3 4
    const keyMap = {
        'q': 0, 'w': 1, 'e': 2, 'r': 3,
        'a': 4, 's': 5, 'd': 6, 'f': 7,
        'z': 8, 'x': 9, 'c': 10, 'v': 11,
        '1': 12, '2': 13, '3': 14, '4': 15
    };
    
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        if (key in keyMap) {
            const padIndex = keyMap[key];
            engine.playSound(padIndex);
            e.preventDefault();
        }
    });
    
    console.log('⌨️ Keyboard shortcuts enabled (Q-R, A-F, Z-V, 1-4)');
}

/**
 * Display engine status
 */
function displayEngineStatus() {
    const status = engine.getStatus();
    console.log('🎵 Engine Status:', status);
}

/**
 * Test headless mode (without GUI)
 */
async function testHeadless() {
    console.log('🧪 Testing headless mode...');
    
    // Create standalone engine
    const testEngine = new SamplerEngine(4);
    
    // Load some sounds directly
    const testSounds = [
        { url: 'sounds/drum1.mp3', name: 'Kick' },
        { url: 'sounds/drum2.mp3', name: 'Snare' },
        { url: 'sounds/drum3.mp3', name: 'HiHat' },
        { url: 'sounds/drum4.mp3', name: 'Clap' }
    ];
    
    await testEngine.loadAll(testSounds);
    
    // Play sequence
    console.log('Playing sequence...');
    testEngine.playSound(0); // Kick
    setTimeout(() => testEngine.playSound(1), 500); // Snare
    setTimeout(() => testEngine.playSound(2), 750); // HiHat
    setTimeout(() => testEngine.playSound(0), 1000); // Kick
    setTimeout(() => testEngine.playSound(3), 1500); // Clap
    
    console.log('✓ Headless test complete');
}

/**
 * Initialize the application
 */
async function init() {
    console.log('🚀 Initializing sampler application...');
    
    try {
        // Create engine
        engine = new SamplerEngine(16);
        engine.init();
        
        // Create GUI
        gui = new SamplerGUI(engine);
        await gui.init();
        
        // Setup UI handlers
        setupUI();
        setupKeyboard();
        
        // Fetch and populate presets
        const presets = await fetchPresets();
        populatePresetDropdown(presets);
        
        // Display status
        displayEngineStatus();
        updateStatus('Ready - Select a preset to begin', 'success');
        
        // Make instances globally accessible for console testing
        window.engine = engine;
        window.gui = gui;
        window.testHeadless = testHeadless;
        
        console.log('✓ Application initialized');
        console.log('💡 Try: engine.getStatus(), gui.getMIDIDevices(), testHeadless()');
        
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus(`Initialization error: ${error.message}`, 'error');
    }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
