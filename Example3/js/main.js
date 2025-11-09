// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// "named" imports from utils.js and soundutils.js
import { playSound } from './soundutils.js';
import SoundSample from './soundsample.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;

// Server configuration
const SERVER_URL = 'http://localhost:3000';
const PRESETS_API = `${SERVER_URL}/api/presets`;

// Arrays to store presets and current sound samples
let presets = [];
let soundSamples = [];
let currentPresetId = null;

window.onload = async function init() {
    ctx = new AudioContext();

    try {
        // Step 1: Fetch all presets from the server
        console.log('Fetching presets from server...');
        const response = await fetch(PRESETS_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        presets = await response.json();
        console.log('Presets loaded:', presets);
        
        // Step 2: Build the dropdown menu with presets
        buildPresetDropdown();
        
        // Step 3: Load the first preset by default
        if (presets.length > 0) {
            await loadPreset(presets[0].id);
        }
        
    } catch (error) {
        console.error('Error loading presets:', error);
        const container = document.querySelector("#buttonsContainer");
        container.innerHTML = `
            <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                <h3>⚠️ Server Connection Error</h3>
                <p>Cannot connect to the server at ${SERVER_URL}</p>
                <p>Make sure the server is running:</p>
                <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; display: inline-block;">
cd server
npm install
npm run start
                </pre>
                <p style="margin-top: 15px;">Error details: ${error.message}</p>
            </div>
        `;
    }
}

// Build the preset dropdown menu
function buildPresetDropdown() {
    const container = document.querySelector("#buttonsContainer");
    
    // Create preset selector container
    const selectorDiv = document.createElement('div');
    selectorDiv.id = 'presetSelector';
    selectorDiv.innerHTML = `
        <label for="presetDropdown">🎹 Select Preset:</label>
        <select id="presetDropdown">
            ${presets.map(preset => `
                <option value="${preset.id}">${preset.name} - ${preset.description}</option>
            `).join('')}
        </select>
    `;
    
    container.appendChild(selectorDiv);
    
    // Create sounds container
    const soundsDiv = document.createElement('div');
    soundsDiv.id = 'soundsContainer';
    container.appendChild(soundsDiv);
    
    // Add event listener to dropdown
    const dropdown = document.querySelector('#presetDropdown');
    dropdown.addEventListener('change', async (event) => {
        const presetId = parseInt(event.target.value);
        await loadPreset(presetId);
    });
}

// Load a preset and its sounds
async function loadPreset(presetId) {
    const soundsContainer = document.querySelector('#soundsContainer');
    soundsContainer.innerHTML = '<p class="loading">🎧 Loading sounds...</p>';
    
    try {
        // Find the preset
        const preset = presets.find(p => p.id === presetId);
        if (!preset) {
            throw new Error(`Preset ${presetId} not found`);
        }
        
        console.log(`Loading preset: ${preset.name}`);
        currentPresetId = presetId;
        
        // Clear previous sounds
        soundSamples = [];
        
        // Create SoundSample objects from the preset's sounds
        preset.sounds.forEach((sound, index) => {
            const sample = new SoundSample(sound.url, sound.name, index);
            soundSamples.push(sample);
        });
        
        // Load all sounds using Promise.all
        console.log(`Loading ${soundSamples.length} sounds...`);
        const loadPromises = soundSamples.map(sample => sample.load(ctx));
        await Promise.all(loadPromises);
        
        console.log(`Successfully loaded ${soundSamples.length} sounds from ${preset.name}`);
        
        // Generate buttons for each sound
        buildSoundButtons();
        
    } catch (error) {
        console.error('Error loading preset:', error);
        soundsContainer.innerHTML = `
            <p style="color: #ff6b6b;">Error loading preset: ${error.message}</p>
        `;
    }
}

// Build the sound buttons
function buildSoundButtons() {
    const soundsContainer = document.querySelector('#soundsContainer');
    soundsContainer.innerHTML = ''; // Clear loading message
    
    soundSamples.forEach((sample, index) => {
        const button = document.createElement('button');
        button.textContent = sample.name;
        button.className = 'playButton';
        button.dataset.index = index;
        
        // Add click event listener to play sound
        button.onclick = function() {
            const buffer = sample.getBuffer();
            playSound(ctx, buffer, 0, buffer.duration);
            
            // Add visual feedback
            button.classList.add('playing');
            setTimeout(() => {
                button.classList.remove('playing');
            }, 300);
        };
        
        soundsContainer.appendChild(button);
    });
}

