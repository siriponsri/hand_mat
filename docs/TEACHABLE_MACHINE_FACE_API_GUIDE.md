# HandMat Model Integration Guide - Teachable Machine & Face-API.js

## Overview
HandMat ได้รับการปรับปรุงให้รองรับ:
- **Hand Recognition**: Teachable Machine models
- **Face Emotion Analysis**: face-api.js (frontend-based)

## 🤖 Hand Model - Teachable Machine Integration

### การเตรียม Teachable Machine Model

1. **Train Model ที่ Teachable Machine**
   - ไปที่: https://teachablemachine.withgoogle.com/
   - เลือก "Image Project"
   - อัพโหลดรูปภาพท่าทางมือต่างๆ
   - Train model จนได้ผลลัพธ์ที่ดี

2. **Export Model**
   ```
   - คลิก "Export Model" 
   - เลือก "TensorFlow Lite"
   - Download ไฟล์:
     * model.tflite
     * metadata.json
   ```

3. **วางไฟล์ในโฟลเดอร์**
   ```
   backend/models/hand/
   ├── model.tflite      # จาก Teachable Machine
   └── metadata.json     # จาก Teachable Machine
   ```

### การใช้งาน Hand Model

```python
# Backend จะโหลด Teachable Machine model อัตโนมัติ
POST /api/recognize
{
  "image": "base64_encoded_image"
}

# Response:
{
  "prediction": "hello",           # จาก Teachable Machine labels
  "confidence": 0.95,              # จาก Teachable Machine
  "model_loaded": true,
  "model_type": "teachable_machine"
}
```

## 👥 Face Model - face-api.js Integration

### Frontend Setup (face-api.js)

1. **Install face-api.js**
   ```bash
   npm install face-api.js
   ```

2. **Basic Frontend Code**
   ```javascript
   import * as faceapi from 'face-api.js';
   
   // Load models
   await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
   await faceapi.nets.faceExpressionNet.loadFromUri('/models');
   
   // Detect emotion
   const detection = await faceapi
     .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
     .withFaceExpressions();
   
   if (detection) {
     const emotions = detection.expressions;
     const topEmotion = Object.keys(emotions).reduce((a, b) => 
       emotions[a] > emotions[b] ? a : b
     );
     
     // Send to backend
     const result = await fetch('/api/face/analyze', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         frontend_result: {
           emotion: topEmotion,
           confidence: emotions[topEmotion],
           all_emotions: emotions
         }
       })
     });
   }
   ```

### Face-API.js Models
วางไฟล์ model ใน `public/models/`:
```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_expression_model-weights_manifest.json
├── face_expression_model-shard1
└── face_expression_model-shard2
```

### การใช้งาน Face API

```javascript
// ส่งผลลัพธ์จาก face-api.js ไปยัง backend
POST /api/face/analyze
{
  "frontend_result": {
    "emotion": "happy",
    "confidence": 0.85,
    "all_emotions": {
      "happy": 0.85,
      "neutral": 0.10,
      "sad": 0.05
    }
  }
}

// Response:
{
  "success": true,
  "emotion": "happy",
  "confidence": 85,
  "model_info": {
    "name": "FaceAPIJSModel",
    "type": "face_api_js",
    "status": "ready"
  }
}
```

## 🔄 Integration Workflow

### Complete Pipeline
```javascript
// 1. Capture image from webcam
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
context.drawImage(video, 0, 0, canvas.width, canvas.height);

// 2. Convert to base64 for hand recognition
const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

// 3. Send to hand recognition (Teachable Machine)
const handResult = await fetch('/api/recognize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: imageData })
});

// 4. Process face emotion with face-api.js
const detection = await faceapi
  .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
  .withFaceExpressions();

let faceResult;
if (detection) {
  const emotions = detection.expressions;
  const topEmotion = Object.keys(emotions).reduce((a, b) => 
    emotions[a] > emotions[b] ? a : b
  );
  
  // 5. Send face results to backend
  faceResult = await fetch('/api/face/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frontend_result: {
        emotion: topEmotion,
        confidence: emotions[topEmotion]
      }
    })
  });
} else {
  // No face detected
  faceResult = await fetch('/api/face/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frontend_result: {
        emotion: 'neutral',
        confidence: 0.0
      }
    })
  });
}

// 6. Combine results for LLM
const combinedResult = await fetch('/api/compose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hand_recognition: await handResult.json(),
    face_emotion: await faceResult.json()
  })
});
```

## 📁 File Structure

```
handmat/
├── backend/
│   ├── models/
│   │   ├── hand/
│   │   │   ├── model.tflite        # จาก Teachable Machine
│   │   │   └── metadata.json       # จาก Teachable Machine
│   │   └── face/                   # ไม่ต้องใช้ (face-api.js ทำงานใน frontend)
│   ├── services/
│   │   ├── hand_backend/
│   │   │   └── teachable_machine_model.py
│   │   └── face_backend/
│   │       └── face_api_model.py
│   └── api/
│       ├── recognize.py            # Teachable Machine integration
│       ├── face.py                 # face-api.js interface
│       └── compose.py              # LLM composition
└── frontend/
    ├── public/
    │   └── models/                 # face-api.js models
    │       ├── tiny_face_detector_*
    │       └── face_expression_*
    └── src/
        └── services/
            ├── teachableMachine.ts  # Teachable Machine integration
            └── faceAPI.ts          # face-api.js integration
```

## 🚀 Deployment Steps

### 1. Backend Setup
```bash
# Install TensorFlow for Teachable Machine
pip install tensorflow>=2.12.0

# Start backend
cd backend
python app.py
```

### 2. Frontend Setup
```bash
# Install face-api.js
npm install face-api.js

# Add face-api.js models to public/models/
# Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

# Start frontend
npm run dev
```

### 3. Model Integration
```bash
# 1. Train Teachable Machine model
# 2. Download model.tflite และ metadata.json
# 3. วางใน backend/models/hand/
# 4. Restart backend
```

## 🔧 Configuration

### Environment Variables
```bash
# backend/.env
MODEL_PATH=./models
TEACHABLE_MACHINE_THRESHOLD=0.7
FACE_API_ENDPOINT=/api/face/analyze
```

### Frontend Configuration
```javascript
// frontend/src/config/models.ts
export const FACE_API_CONFIG = {
  MODEL_URL: '/models',
  DETECTION_OPTIONS: new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5
  })
};

export const TEACHABLE_MACHINE_CONFIG = {
  BACKEND_URL: '/api/recognize',
  CONFIDENCE_THRESHOLD: 0.7
};
```

## 🎯 Expected Results

### With Models Available:
```json
{
  "hand": {
    "prediction": "hello",      // จาก Teachable Machine
    "confidence": 0.95,
    "model_type": "teachable_machine"
  },
  "face": {
    "emotion": "happy",         // จาก face-api.js
    "confidence": 0.85,
    "model_type": "face_api_js"
  },
  "llm": {
    "sentence": "You're happily saying hello with your hands!"
  }
}
```

### Without Models:
```json
{
  "hand": {
    "prediction": "Unknown",
    "confidence": 0.0
  },
  "face": {
    "emotion": "neutral", 
    "confidence": 0.0
  },
  "llm": {
    "sentence": "I'm trying to understand what you're communicating."
  }
}
```

## 📖 Additional Resources

- **Teachable Machine**: https://teachablemachine.withgoogle.com/
- **face-api.js**: https://github.com/justadudewhohacks/face-api.js/
- **TensorFlow Lite**: https://www.tensorflow.org/lite
- **Model Downloads**: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

ระบบของคุณพร้อมใช้งานด้วย Teachable Machine และ face-api.js แล้ว! 🎉
