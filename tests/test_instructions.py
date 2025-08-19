"""
การทดสอบ Face Model และ LLM APIs โดยใช้ curl command ผ่าน terminal
"""

# ทดสอบ Face Detection API
print("🎭 ทดสอบ Face Detection API")
print("curl -X POST http://127.0.0.1:5000/api/face/analyze -H \"Content-Type: application/json\" -d '{\"image\": \"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=\"}'")

# ทดสอบ Hand Recognition API  
print("\n👋 ทดสอบ Hand Recognition API")
print("curl -X POST http://127.0.0.1:5000/api/recognize -H \"Content-Type: application/json\" -d '{\"image\": \"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=\"}'")

# ทดสอบ LLM Compose API
print("\n🧠 ทดสอบ LLM Compose API") 
print("curl -X POST http://127.0.0.1:5000/api/compose -H \"Content-Type: application/json\" -d '{\"hand_result\": {\"prediction\": \"hello\", \"confidence\": 0.95}, \"face_result\": {\"emotion\": \"happy\", \"confidence\": 0.88}}'")

print("\n✅ Backend Server กำลังรันที่ http://127.0.0.1:5000")
print("✅ Face Detection Models โหลดแล้ว (frontend/public/models/)")
print("⚠️ Hand Models ยังไม่มี (ต้องสร้างจาก Teachable Machine)")

print("\n📋 สรุปสถานะปัจจุบัน:")
print("• Face Detection: ใช้ Mock Models (จะแสดง 'neutral' emotion)")
print("• Hand Recognition: ใช้ Mock Models (จะแสดง 'Unknown' gesture)")  
print("• LLM Composition: ใช้ Template-based (ทำงานได้ปกติ)")
print("• การรวมผลลัพธ์: ระบบจะรวม hand + face → sentence")

print("\n🎯 การทำงานจริง:")
print("• เมื่อมี Hand Models → จะรู้จักท่าทางจริง")
print("• Face Models พร้อมใช้แล้ว → จะวิเคราะห์อารมณ์ได้")
print("• LLM สร้างประโยคจากผลลัพธ์ทั้งสอง")
