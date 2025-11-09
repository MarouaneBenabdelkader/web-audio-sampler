// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// "named" imports from utils.js and soundutils.js
import { loadAndDecodeSound, playSound } from './soundutils.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;

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

// Array to store decoded sounds
let decodedSounds = [];

window.onload = async function init() {
    ctx = new AudioContext();

    // Create an array of promises for loading and decoding all sounds
    const loadPromises = soundURLs.map(url => loadAndDecodeSound(url, ctx));
    
    // Use Promise.all to wait for all sounds to be loaded and decoded
    // This will execute all loading operations in parallel
    decodedSounds = await Promise.all(loadPromises);
    
    console.log(`Successfully loaded ${decodedSounds.length} sounds`);
    
    // Generate a play button for each sound
    const buttonContainer = document.querySelector("#playButton").parentElement;
    
    // Remove the original placeholder button
    document.querySelector("#playButton").remove();
    
    // Create a button for each sound
    decodedSounds.forEach((sound, index) => {
        const button = document.createElement('button');
        button.textContent = `Play Sound ${index + 1}`;
        button.className = 'playButton';
        
        // Add click event listener to play the corresponding sound
        button.onclick = function() {
            playSound(ctx, sound, 0, sound.duration);
        };
        
        buttonContainer.appendChild(button);
        buttonContainer.appendChild(document.createTextNode(' ')); // Add space between buttons
    });
}
