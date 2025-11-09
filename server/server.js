const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes (allows Example3 to fetch from this server)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Sample presets data - each preset contains a collection of audio files
const presets = [
    {
        id: 1,
        name: "Drum Kit 1",
        description: "Basic drum sounds from Wikimedia",
        sounds: [
            {
                name: "Kick",
                url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav"
            },
            {
                name: "Snare",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3"
            },
            {
                name: "Hi-Hat Closed",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3"
            },
            {
                name: "Hi-Hat Open",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3"
            },
            {
                name: "Tom High",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3"
            },
            {
                name: "Tom Mid",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Tom_Medio.ogg/Tom_Medio.ogg.mp3"
            },
            {
                name: "Tom Low",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Tom_Grave.ogg/Tom_Grave.ogg.mp3"
            },
            {
                name: "Crash",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3"
            },
            {
                name: "Ride",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3"
            }
        ]
    },
    {
        id: 2,
        name: "Percussion Kit",
        description: "Latin percussion sounds",
        sounds: [
            {
                name: "Bongo High",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3"
            },
            {
                name: "Bongo Low",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Tom_Grave.ogg/Tom_Grave.ogg.mp3"
            },
            {
                name: "Cowbell",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3"
            },
            {
                name: "Shaker",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3"
            }
        ]
    },
    {
        id: 3,
        name: "Electronic Kit",
        description: "Electronic and synth drums",
        sounds: [
            {
                name: "Bass Drum",
                url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav"
            },
            {
                name: "Snare Electronic",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3"
            },
            {
                name: "Hi-Hat",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3"
            },
            {
                name: "Clap",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3"
            },
            {
                name: "Crash Cymbal",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3"
            },
            {
                name: "Ride Cymbal",
                url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3"
            }
        ]
    }
];

// Routes

// Get all presets
app.get('/api/presets', (req, res) => {
    console.log('GET /api/presets - Sending all presets');
    res.json(presets);
});

// Get a specific preset by ID
app.get('/api/presets/:id', (req, res) => {
    const presetId = parseInt(req.params.id);
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
        console.log(`GET /api/presets/${presetId} - Sending preset: ${preset.name}`);
        res.json(preset);
    } else {
        console.log(`GET /api/presets/${presetId} - Preset not found`);
        res.status(404).json({ error: 'Preset not found' });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Audio Presets API Server',
        endpoints: {
            'GET /api/presets': 'Get all presets',
            'GET /api/presets/:id': 'Get a specific preset by ID'
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🎵 Audio Presets Server is running on http://localhost:${PORT}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   - GET http://localhost:${PORT}/api/presets`);
    console.log(`   - GET http://localhost:${PORT}/api/presets/:id`);
    console.log(`\n💡 Try opening http://localhost:${PORT}/api/presets in your browser!`);
});
