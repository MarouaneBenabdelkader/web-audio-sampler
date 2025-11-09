// Class to manage individual sound samples with their waveform and trim bar data
export default class SoundSample {
    constructor(url, name, index) {
        this.url = url;
        this.name = name;
        this.index = index;
        this.decodedBuffer = null;
    }

    // Load and decode the sound
    async load(audioContext) {
        const response = await fetch(this.url);
        const arrayBuffer = await response.arrayBuffer();
        this.decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        console.log(`Sound ${this.name} loaded and decoded`);
        
        return this.decodedBuffer;
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
