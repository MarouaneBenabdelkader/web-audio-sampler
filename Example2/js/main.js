// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// default imports of classes from waveformdrawer.js and trimbarsdrawer.js
import WaveformDrawer from './waveformdrawer.js';
import TrimbarsDrawer from './trimbarsdrawer.js';
import SoundSample from './soundsample.js';
// "named" imports from utils.js and soundutils.js
import { playSound } from './soundutils.js';
import { pixelToSeconds } from './utils.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;

<<<<<<< HEAD
// Array of sound URLs
const soundURLs = [
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Tom_Medio.ogg/Tom_Medio.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Tom_Grave.ogg/Tom_Grave.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3'
];

const soundNames = [
    'Kick',
    'Snare',
    'Hi-Hat Closed',
    'Hi-Hat Open',
    'Tom High',
    'Tom Mid',
    'Tom Low',
    'Crash',
    'Ride'
];

// Array to store SoundSample objects
let soundSamples = [];
let currentSound = null; // Currently selected sound
=======
const soundURL =
    'https://mainline.i3s.unice.fr/WAMSampler2/audio/808/Maracas%20808.wav';
let decodedSound;
>>>>>>> e62ff46ed008406c36bb35a7cb2f682b4238fa9b

let canvas, canvasOverlay;
// waveform drawer is for drawing the waveform in the canvas
// trimbars drawer is for drawing the trim bars in the overlay canvas

let waveformDrawer, trimbarsDrawer;
let mousePos = { x: 0, y: 0 }
<<<<<<< HEAD
=======
// The button for playing the sound
let playButton = document.querySelector("#playButton");
// disable the button until the sound is loaded and decoded
playButton.disabled = true;
let debugButton; 
>>>>>>> e62ff46ed008406c36bb35a7cb2f682b4238fa9b

window.onload = async function init() {
    ctx = new AudioContext();

     debugButton = document.querySelector("#debug");
     debugButton.onclick = function(evt) {
        waveformDrawer.drawWave(0, canvas.height);
     };

    // two canvas : one for drawing the waveform, the other for the trim bars
    canvas = document.querySelector("#myCanvas");
    canvasOverlay = document.querySelector("#myCanvasOverlay");

    // create the waveform drawer and the trimbars drawer
    waveformDrawer = new WaveformDrawer();
    trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 100, 200);

    // Create SoundSample objects for each sound URL
    soundURLs.forEach((url, index) => {
        const soundSample = new SoundSample(url, soundNames[index], index);
        soundSamples.push(soundSample);
    });

    // Load all sounds using Promise.all
    const loadingDiv = document.querySelector("#playButton");
    loadingDiv.textContent = 'Loading sounds...';
    
    const loadPromises = soundSamples.map(sample => sample.load(ctx));
    await Promise.all(loadPromises);
    
    console.log(`Successfully loaded ${soundSamples.length} sounds`);
    
    // Generate buttons for each sound
    const buttonContainer = document.querySelector("#playButton").parentElement;
    const loadingElement = document.querySelector("#playButton");
    loadingElement.remove();
    
    // Create a container for buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.id = 'buttonsContainer';
    buttonContainer.insertBefore(buttonsDiv, buttonContainer.querySelector('.wrapper'));
    
    soundSamples.forEach((sample, index) => {
        const button = document.createElement('button');
        button.textContent = sample.name;
        button.className = 'playButton';
        button.dataset.index = index;
        
        // Add click event listener to select and play sound
        button.onclick = function() {
            selectSound(index);
        };
        
        buttonsDiv.appendChild(button);
        buttonsDiv.appendChild(document.createTextNode(' '));
    });

    // Select the first sound by default
    selectSound(0);

    // declare mouse event listeners for adjusting the trim bars
    canvasOverlay.onmousemove = (evt) => {
        // get the mouse position in the canvas
        let rect = canvas.getBoundingClientRect();

        mousePos.x = (evt.clientX - rect.left);
        mousePos.y = (evt.clientY - rect.top);

        // When the mouse moves, we check if we are close to a trim bar
        // if so: move it!
        trimbarsDrawer.moveTrimBars(mousePos);
    }

    canvasOverlay.onmousedown = (evt) => {
        // If a trim bar is close to the mouse position, we start dragging it
        trimbarsDrawer.startDrag();
    }

    canvasOverlay.onmouseup = (evt) => {
        // We stop dragging the trim bars (if they were being dragged)
        trimbarsDrawer.stopDrag();
        
        // Save the current trim bar positions for the current sound
        if (currentSound !== null) {
            soundSamples[currentSound].saveTrimBarPositions(
                trimbarsDrawer.leftTrimBar.x,
                trimbarsDrawer.rightTrimBar.x
            );
        }
    }

    // start the animation loop for drawing the trim bars
    requestAnimationFrame(animate);
};

// Function to select and display a sound
function selectSound(index) {
    // Save trim bar positions of the previous sound
    if (currentSound !== null) {
        soundSamples[currentSound].saveTrimBarPositions(
            trimbarsDrawer.leftTrimBar.x,
            trimbarsDrawer.rightTrimBar.x
        );
    }
    
    currentSound = index;
    const sample = soundSamples[index];
    
    // Update active button styling
    document.querySelectorAll('.playButton').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the waveform for the selected sound
    const colors = ['#83E83E', '#48dbfb', '#ff6b6b', '#a29bfe', '#feca57', '#ff9ff3', '#54a0ff', '#00d2d3', '#ff6348'];
    waveformDrawer.init(sample.getBuffer(), canvas, colors[index % colors.length]);
    waveformDrawer.drawWave(0, canvas.height);
    
    // Restore trim bar positions for this sound
    const positions = sample.getTrimBarPositions();
    trimbarsDrawer.leftTrimBar.x = positions.left;
    trimbarsDrawer.rightTrimBar.x = positions.right;
    
    // Play the sound
    playCurrentSound();
}

// Function to play the currently selected sound
function playCurrentSound() {
    if (currentSound === null) return;
    
    const sample = soundSamples[currentSound];
    const buffer = sample.getBuffer();
    
    // get start and end time (in seconds) from trim bars position.x (in pixels)
    let start = pixelToSeconds(trimbarsDrawer.leftTrimBar.x, buffer.duration, canvas.width);
    let end = pixelToSeconds(trimbarsDrawer.rightTrimBar.x, buffer.duration, canvas.width);
    
    console.log(`Playing ${sample.name}: start: ${start.toFixed(2)}s, end: ${end.toFixed(2)}s`);
    
    playSound(ctx, buffer, start, end);
}

// Animation loop for drawing the trim bars
// We use requestAnimationFrame() to call the animate function
// at a rate of 60 frames per second (if possible)
// see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
function animate() {
    // clear overlay canvas;
    trimbarsDrawer.clear();

    // draw the trim bars
    trimbarsDrawer.draw();

    // redraw in 1/60th of a second
    requestAnimationFrame(animate);
}




