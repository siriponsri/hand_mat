# Models Directory

## Structure

```
models/
├── hand/           # Teachable Machine hand models (.tflite + metadata.json)
├── face/           # Face detection model files (if needed for face-api.js)
└── README.md       # This file
```

## Hand Models (Teachable Machine)

Place your Teachable Machine exported files in the `hand/` directory:
- `model.tflite` - The TensorFlow Lite model file
- `metadata.json` - Model metadata with labels and configuration

## Face Models

The system uses face-api.js which loads models automatically from CDN.
If you need local model files, place them in the `face/` directory.

## Usage

Models are automatically loaded by the respective services:
- Hand models: `services/hand_backend/teachable_machine_model.py`
- Face models: Frontend face-api.js integration