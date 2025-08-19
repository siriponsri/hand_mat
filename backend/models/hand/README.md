# Hand Models Directory

วางไฟล์ Teachable Machine models ที่นี่:

## ไฟล์ที่ต้องการ:
- `model.tflite` - TensorFlow Lite model จาก Teachable Machine
- `metadata.json` - Metadata และ labels จาก Teachable Machine

## วิธีการ:
1. ไปที่ https://teachablemachine.withgoogle.com/
2. สร้าง Image Project สำหรับ hand gestures
3. Train model จนได้ผลที่พอใจ
4. Export เป็น TensorFlow Lite format
5. วางไฟล์ทั้งสองใน directory นี้

## การทดสอบ:
```bash
cd backend
python app.py

# API จะโหลด models อัตโนมัติ
# ตรวจสอบใน logs: "Teachable Machine hand model loaded successfully"
```

## ตัวอย่าง gestures:
- Hello
- Thank you
- Goodbye
- Yes
- No
- I love you
- Help
- Stop

เมื่อวางไฟล์แล้ว restart backend server เพื่อโหลด models ใหม่
