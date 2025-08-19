# 📋 คู่มือการวาง Models สำหรับ HandMat

## 🗂️ โครงสร้างโฟลเดอร์ที่สร้างแล้ว

```
handmat/
├── backend/models/
│   ├── hand/           ✅ สร้างแล้ว - วาง Teachable Machine models
│   ├── face/           ✅ สร้างแล้ว - สำรอง (ไม่จำเป็น)
│   └── llm/            ✅ สร้างแล้ว - สำหรับ Local LLM (optional)
└── frontend/public/models/  ✅ สร้างแล้ว - วาง face-api.js models
```

## 🤖 1. Hand Model (Teachable Machine)

### ไฟล์ที่ต้องวาง:
```
backend/models/hand/
├── model.tflite      👈 วางไฟล์นี้
└── metadata.json     👈 วางไฟล์นี้
```

### วิธีการ:
1. **Train Model** ที่ https://teachablemachine.withgoogle.com/
   - เลือก "Image Project"
   - อัพโหลดรูปท่าทางมือต่างๆ
   - Train จนได้ผลที่พอใจ

2. **Export Model**
   - คลิก "Export Model"
   - เลือก "TensorFlow Lite"
   - Download ไฟล์ `model.tflite` และ `metadata.json`

3. **วางไฟล์**
   ```bash
   # Copy ไฟล์ไปยัง
   backend/models/hand/model.tflite
   backend/models/hand/metadata.json
   ```

### ตัวอย่าง metadata.json:
```json
{
  "labels": ["hello", "thank_you", "goodbye", "yes", "no"],
  "preprocessing": {
    "mean": 127.5,
    "std": 127.5
  }
}
```

## 👥 2. Face Model (face-api.js)

### ไฟล์ที่ต้องวาง:
```
frontend/public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_expression_model-weights_manifest.json
├── face_expression_model-shard1
└── face_expression_model-shard2
```

### วิธีการ:
1. **Download Models** จาก GitHub:
   ```bash
   # ไปที่
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   
   # Download ไฟล์เหล่านี้:
   - tiny_face_detector_model-weights_manifest.json
   - tiny_face_detector_model-shard1
   - face_expression_model-weights_manifest.json  
   - face_expression_model-shard1
   - face_expression_model-shard2
   ```

2. **วางไฟล์ใน frontend/public/models/**

### Alternative: ใช้ CDN
```typescript
// ใน frontend code สามารถใช้ CDN แทน
await faceapi.nets.tinyFaceDetector.loadFromUri(
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
);
```

## 🧠 3. LLM Integration

### Option 1: API Service (แนะนำ)
```typescript
// ใน backend/api/compose.py
// ปัจจุบันใช้ mock LLM
// สามารถเชื่อม API:

// OpenAI GPT
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{"role": "user", "content": prompt}]
});

// Google Gemini  
const result = await model.generateContent(prompt);

// Local API
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({ model: 'llama2', prompt: prompt })
});
```

### Option 2: Local LLM (ขั้นสูง)
```
backend/models/llm/
├── model.bin         # Ollama, LM Studio model
├── config.json       # Model configuration
└── tokenizer.json    # Tokenizer settings
```

## 🚀 การทดสอบ Models

### 1. ทดสอบ Hand Model
```bash
# Start backend
cd backend
python app.py

# Test API
curl -X POST http://localhost:5000/api/recognize \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data"}'
```

### 2. ทดสอบ Face Model
```javascript
// ใน frontend
const detection = await faceapi
  .detectSingleFace(imageElement)
  .withFaceExpressions();
```

### 3. ทดสอบ LLM
```bash
curl -X POST http://localhost:5000/api/compose \
  -H "Content-Type: application/json" \
  -d '{
    "hand_recognition": {"prediction": "hello", "confidence": 0.9},
    "face_emotion": {"emotion": "happy", "confidence": 0.8}
  }'
```

## 📝 การตรวจสอบ

### Hand Model Status:
```bash
# ตรวจสอบว่าไฟล์อยู่ในตำแหน่งที่ถูก
ls backend/models/hand/
# ควรเห็น: model.tflite, metadata.json
```

### Face Model Status:
```bash
# ตรวจสอบ face-api.js models
ls frontend/public/models/
# ควรเห็น: tiny_face_detector_*, face_expression_*
```

### Backend API Status:
```bash
curl http://localhost:5000/api/health
# ควรได้ response พร้อม model status
```

## 🔧 Troubleshooting

### ถ้า Hand Model ไม่โหลด:
- ตรวจสอบ path: `backend/models/hand/model.tflite`
- ตรวจสอบ `metadata.json` format
- Install TensorFlow: `pip install tensorflow`

### ถ้า Face Model ไม่โหลด:
- ตรวจสอบ path: `frontend/public/models/`
- ลองใช้ CDN แทน local files
- ตรวจสอบ network ใน browser dev tools

### ถ้า LLM ไม่ทำงาน:
- ตรวจสอบ API keys (OpenAI, Google)
- ตรวจสอบ Local LLM server status
- ดู logs ใน backend console

## ✅ Next Steps

1. **วาง Hand Model** จาก Teachable Machine
2. **วาง Face Models** จาก face-api.js  
3. **Configure LLM** (API หรือ Local)
4. **ทดสอบ Complete Flow** ทั้งระบบ

ระบบจะทำงานได้ครบถ้วนเมื่อมี models ทั้งหมดแล้ว! 🎯
