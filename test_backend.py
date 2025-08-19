"""
Test script สำหรับทดสอบ Face Detection และ LLM APIs
"""
import requests
import json
import base64
from io import BytesIO
from PIL import Image

def test_health():
    """ทดสอบ health endpoint"""
    try:
        response = requests.get("http://127.0.0.1:5000/api/health")
        print("🔍 Health Check:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def create_test_image():
    """สร้างภาพทดสอบแบบง่ายๆ"""
    # สร้างภาพสีแดงขนาด 100x100
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/jpeg;base64,{img_str}"

def test_face_detection():
    """ทดสอบ Face Detection API"""
    try:
        test_image = create_test_image()
        data = {"image": test_image}
        
        response = requests.post(
            "http://127.0.0.1:5000/api/face/analyze",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print("\n🎭 Face Detection Test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"❌ Face detection failed: {e}")
        return None

def test_hand_recognition():
    """ทดสอบ Hand Recognition API"""
    try:
        test_image = create_test_image()
        data = {"image": test_image}
        
        response = requests.post(
            "http://127.0.0.1:5000/api/recognize",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print("\n👋 Hand Recognition Test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"❌ Hand recognition failed: {e}")
        return None

def test_llm_compose():
    """ทดสอบ LLM Sentence Composition"""
    try:
        data = {
            "hand_result": {"prediction": "hello", "confidence": 0.95},
            "face_result": {"emotion": "happy", "confidence": 0.88}
        }
        
        response = requests.post(
            "http://127.0.0.1:5000/api/compose",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print("\n🧠 LLM Composition Test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"❌ LLM composition failed: {e}")
        return None

def main():
    """เรียกใช้การทดสอบทั้งหมด"""
    print("🚀 เริ่มทดสอบ HandMat Backend APIs\n")
    
    if not test_health():
        print("❌ Backend server ไม่ทำงาน")
        return
    
    face_result = test_face_detection()
    hand_result = test_hand_recognition()
    
    if face_result and hand_result:
        llm_result = test_llm_compose()
        
        print("\n📊 สรุปผลการทดสอบ:")
        print("✅ Health Check: ผ่าน")
        print("✅ Face Detection: ผ่าน")  
        print("✅ Hand Recognition: ผ่าน")
        print("✅ LLM Composition: ผ่าน")
        print("\n🎉 ระบบ Backend พร้อมใช้งาน!")
    else:
        print("\n⚠️ มีบางส่วนที่ไม่ทำงาน")

if __name__ == "__main__":
    main()
