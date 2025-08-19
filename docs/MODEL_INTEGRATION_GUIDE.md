# Model Integration Guide - HandMat Project

## การเพิ่ม Model เข้าสู่ระบบ

ระบบ HandMat ได้เตรียมพร้อมสำหรับการใส่ model จริงแล้ว ปัจจุบันระบบจะแสดง "Unknown" สำหรับทุกการตรวจจับ เนื่องจากยังไม่มี model ที่โหลดเข้ามา

### 📁 โครงสร้างโฟลเดอร์สำหรับ Models

```
backend/
├── models/                     # โฟลเดอร์สำหรับเก็บ model files
│   ├── hand_model.tflite      # Hand recognition model (TensorFlow Lite)
│   ├── hand_model.pkl         # หรือ Hand recognition model (Pickle)
│   ├── face_model.tflite      # Face emotion model (TensorFlow Lite)
│   ├── face_model.pkl         # หรือ Face emotion model (Pickle)
│   └── README.md              # คำแนะนำการใช้งาน models
└── services/
    ├── hand_backend/
    │   ├── real_model.py      # ✅ Ready - Hand model implementation
    │   ├── mock_model.py      # Mock model (for testing)
    │   └── base_model.py      # Base class
    └── face_backend/
        ├── real_model.py      # ⏳ TODO - Face model implementation
        ├── mock_model.py      # Mock model (for testing)
        └── base_model.py      # Base class
```

### 🔧 การเพิ่ม Hand Recognition Model

#### 1. วาง Model File
```bash
# วาง hand model file ในโฟลเดอร์ models
cp your_hand_model.tflite backend/models/hand_model.tflite
# หรือ
cp your_hand_model.pkl backend/models/hand_model.pkl
```

#### 2. แก้ไข RealHandModel (ถ้าจำเป็น)
ไฟล์: `backend/services/hand_backend/real_model.py`

```python
class RealHandModel(BaseHandModel):
    def __init__(self, model_path="models/hand_model.tflite"):
        # โหลด model ของคุณที่นี่
        self.model = load_your_model(model_path)
        self.classes = ["สวัสดี", "ฉัน", "กิน", "Unknown"]  # คลาสที่ model รองรับ
    
    def predict(self, image):
        # ใส่ logic การทำนายของ model ของคุณ
        predictions = self.model.predict(image)
        
        # ส่งคืนในรูปแบบที่ระบบต้องการ
        return [
            {
                "label": "สวัสดี",  # หรือผลลัพธ์จาก model
                "confidence": 0.85,
                "probability": 0.85
            }
        ]
```

#### 3. ติดตั้ง Dependencies (ถ้าจำเป็น)
```bash
# สำหรับ TensorFlow
pip install tensorflow

# สำหรับ PyTorch
pip install torch torchvision

# สำหรับ scikit-learn
pip install scikit-learn
```

### 🎭 การเพิ่ม Face Emotion Model

#### 1. สร้าง RealFaceModel
ไฟล์: `backend/services/face_backend/real_model.py`

```python
import numpy as np
from .base_model import BaseFaceModel

class RealFaceModel(BaseFaceModel):
    def __init__(self, model_path="models/face_model.tflite"):
        self.model = load_your_face_model(model_path)
        self.emotions = ["neutral", "happy", "sad", "angry", "surprised", "fear", "disgust"]
    
    def analyze_emotion(self, image):
        # ใส่ logic การวิเคราะห์อารมณ์
        emotion_scores = self.model.predict(image)
        
        return {
            "emotion": "happy",  # อารมณ์ที่ตรวจพบ
            "confidence": 0.85,  # ความมั่นใจ (0-1)
            "emotions_detected": [
                {"emotion": "happy", "confidence": 0.85},
                {"emotion": "neutral", "confidence": 0.12}
            ]
        }
```

#### 2. เปิดใช้งาน Face Model
แก้ไขไฟล์: `backend/api/face.py`

```python
# เปิด comment บรรทัดเหล่านี้
try:
    from services.face_backend.real_model import RealFaceModel
    face_model = RealFaceModel()
    if face_model.is_loaded():
        face_model_available = True
        logger.info("Real face model loaded successfully")
    else:
        face_model = None
        face_model_available = False
except Exception as e:
    logger.warning(f"Face model loading failed: {e}")
    face_model = None
    face_model_available = False
```

### 📊 ผลลัพธ์ที่คาดหวัง

#### เมื่อมี Model แล้ว:
- **มีการตรวจจับ**: แสดงผลตาม model
- **ไม่สามารถตรวจจับ**: แสดง "Unknown" (confidence < 50%)
- **Error**: แสดง "Unknown" เพื่อป้องกันระบบล่ม

#### เมื่อยังไม่มี Model:
- **ทุกกรณี**: แสดง "Unknown" เพื่อให้ระบบทำงานต่อได้

### 🧪 การทดสอบ

#### 1. ทดสอบว่า Model โหลดสำเร็จ
```bash
curl http://localhost:5000/api/models/info
```

Response เมื่อมี model:
```json
{
  "success": true,
  "models": {
    "hand_model": {
      "name": "RealHandModel",
      "version": "1.0.0",
      "type": "production",
      "status": "ready",
      "classes": ["สวัสดี", "ฉัน", "กิน", "Unknown"]
    }
  }
}
```

Response เมื่อไม่มี model:
```json
{
  "success": true,
  "models": {
    "hand_model": {
      "name": "None",
      "version": "N/A",
      "type": "unavailable",
      "status": "unavailable",
      "message": "No hand recognition model loaded. Please add model files to enable recognition."
    }
  }
}
```

#### 2. ทดสอบการตรวจจับ
```bash
# ส่งภาพไปทดสอบ
curl -X POST -F "file=@test_image.jpg" http://localhost:5000/api/recognize
```

### 🎯 Model Requirements

#### Hand Recognition Model:
- **Input**: RGB image (numpy array)
- **Output**: List of predictions with label and confidence
- **Supported formats**: TensorFlow Lite (.tflite), Pickle (.pkl), ONNX (.onnx)
- **Classes**: Thai words + "Unknown" fallback

#### Face Emotion Model:
- **Input**: RGB image (numpy array)  
- **Output**: Emotion with confidence score
- **Emotions**: neutral, happy, sad, angry, surprised, fear, disgust
- **Fallback**: "neutral" with 0% confidence

### 🔄 การรีสตาร์ทระบบ

หลังจากเพิ่ม model เข้าไปแล้ว:

```bash
# รีสตาร์ท Backend
cd backend
python app.py

# Frontend จะทำงานต่อเนื่อง (ไม่ต้องรีสตาร์ท)
```

### ❗ หมายเหตุสำคัญ

1. **ระบบยังคงทำงานได้**: แม้ไม่มี model ก็จะแสดง "Unknown"
2. **ไม่มี Mock Data**: ระบบไม่ใช้ข้อมูลปลอมแล้ว จะรอ model จริงเท่านั้น
3. **Error Handling**: ระบบจัดการ error โดยแสดง "Unknown" แทนการ crash
4. **Capture ยังใช้ได้**: สามารถถ่ายภาพและบันทึกได้ตามปกติ

ระบบพร้อมสำหรับ model แล้ว! 🚀
