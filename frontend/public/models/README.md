# Face-API.js Models Directory

วาง face-api.js model files ที่นี่:

## ไฟล์ที่ต้องการ:

### Face Detection:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

### Face Expression Recognition:
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`
- `face_expression_model-shard2`

## วิธี Download:
```bash
# จาก GitHub repository
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

# หรือใช้ wget/curl
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard2
```

## Alternative: ใช้ CDN
หากไม่ต้องการ download ไฟล์ สามารถแก้ไข frontend code ให้ใช้ CDN:

```typescript
await faceapi.nets.tinyFaceDetector.loadFromUri(
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
);
await faceapi.nets.faceExpressionNet.loadFromUri(
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
);
```

## การทดสอบ:
1. วางไฟล์ใน directory นี้
2. เปิด frontend: http://localhost:8081
3. ตรวจสอบ browser console ว่า models โหลดสำเร็จ

## Supported Emotions:
- neutral
- happy
- sad
- angry
- fearful
- disgusted
- surprised
