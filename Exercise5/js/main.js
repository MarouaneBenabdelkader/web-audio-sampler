// Main application - Connects engine and GUI
import SamplerEngine from './sampler-engine.js';
import SamplerGUI from './sampler-gui.js';

// Sound URLs (same as previous examples)
const soundURLs = [
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Tom_Medio.ogg/Tom_Medio.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Tom_Grave.ogg/Tom_Grave.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3',
    // Duplicate some sounds to fill 16 pads
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3'
];

// Global instances
let engine;
let gui;

window.addEventListener('load', init);

async function init() {
    console.log('🎹 Initializing Advanced Sampler...');

    // Create engine (headless)
    engine = new SamplerEngine();

    // Create GUI
    gui = new SamplerGUI(engine);
    gui.createPads();

    // Initialize MIDI
    await gui.initMIDI();

    // Setup button handlers
    setupButtons();

    console.log('✅ Sampler ready!');
    console.log('💡 You can test the engine without GUI in console:');
    console.log('   window.engine.loadSound(soundURLs[0], 0)');
    console.log('   window.engine.playSound(0)');

    // Expose for testing
    window.engine = engine;
    window.gui = gui;
    window.soundURLs = soundURLs;
}

function setupButtons() {
    const loadAllBtn = document.querySelector('#loadAllBtn');
    const clearAllBtn = document.querySelector('#clearAllBtn');

    loadAllBtn.onclick = async () => {
        loadAllBtn.disabled = true;
        loadAllBtn.textContent = '⏳ Loading...';

        try {
            const summary = await engine.loadAll(soundURLs);
            
            console.log(`✅ Loaded ${summary.loaded}/${summary.total} sounds`);
            
            if (summary.failed > 0) {
                console.warn(`⚠️ Failed to load ${summary.failed} sounds`);
            }

            loadAllBtn.textContent = '✓ Load Complete';
            setTimeout(() => {
                loadAllBtn.textContent = '📥 Load All Sounds';
                loadAllBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Load all failed:', error);
            loadAllBtn.textContent = '✗ Load Failed';
            loadAllBtn.disabled = false;
        }
    };

    clearAllBtn.onclick = () => {
        if (confirm('Clear all loaded sounds?')) {
            engine.clearAll();
            console.log('🗑️ All sounds cleared');
        }
    };
}

// Example of headless usage (can be tested in console)
export async function testHeadless() {
    console.log('🧪 Testing headless mode...');
    
    const testEngine = new SamplerEngine();
    
    // Load first 4 sounds
    console.log('Loading sounds...');
    await testEngine.loadAll(soundURLs.slice(0, 4));
    
    // Play them in sequence
    console.log('Playing sounds...');
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            testEngine.playSound(i);
            console.log(`Played sound ${i}`);
        }, i * 500);
    }
    
    console.log('✅ Headless test complete!');
}

// Expose test function
window.testHeadless = testHeadless;
