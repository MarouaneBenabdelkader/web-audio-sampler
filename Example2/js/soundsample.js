// Class to manage individual sound samples with their waveform and trim bar data
export default class SoundSample {
    constructor(url, name, index) {
        this.url = url;
        this.name = name;
        this.index = index;
        this.decodedBuffer = null;
        
        // Store trim bar positions for this sound
        // Default values will be set after loading
        this.trimBarPositions = {
            left: 100,
            right: 200
        };
    }

    // Load and decode the sound
    async load(audioContext) {
        const response = await fetch(this.url);
        const arrayBuffer = await response.arrayBuffer();
        this.decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Set default trim bar positions based on sound duration
        // Left at 15% of canvas width, right at 35% (these will be adjusted by canvas width)
        console.log(`Sound ${this.name} loaded and decoded`);
        
        return this.decodedBuffer;
    }

    // Save current trim bar positions
    saveTrimBarPositions(leftX, rightX) {
        this.trimBarPositions.left = leftX;
        this.trimBarPositions.right = rightX;
    }

    // Get stored trim bar positions
    getTrimBarPositions() {
        return this.trimBarPositions;
    }

    // Get the decoded buffer
    getBuffer() {
        return this.decodedBuffer;
    }

    // Check if sound is loaded
    isLoaded() {
        return this.decodedBuffer !== null;
    }
}
