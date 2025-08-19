#!/usr/bin/env python3
"""
Test script to verify integrated hand + face + LLM system
Tests both scenarios: with models (real results) and without models ("unknown")
"""

import requests
import json
import base64
import io
from PIL import Image
import numpy as np

def create_test_image():
    """Create a simple test image"""
    # Create a simple 224x224 RGB image
    img = Image.new('RGB', (224, 224), color='blue')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return base64.b64encode(img_buffer.getvalue()).decode('utf-8')

def test_hand_recognition():
    """Test hand recognition endpoint"""
    print("Testing Hand Recognition...")
    
    test_image = create_test_image()
    response = requests.post('http://localhost:5000/api/recognize', 
                           json={'image': test_image})
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Hand Recognition Result: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Error: {response.text}")
        return None

def test_face_recognition():
    """Test face emotion analysis endpoint"""
    print("\nTesting Face Emotion Analysis...")
    
    test_image = create_test_image()
    response = requests.post('http://localhost:5000/api/face/analyze', 
                           json={'image': test_image})
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Face Analysis Result: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Error: {response.text}")
        return None

def test_llm_composition(hand_result, face_result):
    """Test LLM composition with combined results"""
    print("\nTesting LLM Composition...")
    
    combined_data = {
        "hand_recognition": hand_result,
        "face_emotion": face_result
    }
    
    response = requests.post('http://localhost:5000/api/compose', 
                           json=combined_data)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"LLM Composition Result: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Error: {response.text}")
        return None

def test_health():
    """Test system health"""
    print("Testing System Health...")
    
    response = requests.get('http://localhost:5000/api/health')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Health Check: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"Error: {response.text}")
        return None

def main():
    """Run complete system test"""
    print("=" * 60)
    print("HandMat Integrated System Test")
    print("=" * 60)
    
    # Test system health first
    health = test_health()
    if not health:
        print("System health check failed!")
        return
    
    # Test individual components
    hand_result = test_hand_recognition()
    face_result = test_face_recognition()
    
    # Test integrated LLM composition
    if hand_result and face_result:
        llm_result = test_llm_composition(hand_result, face_result)
        
        print("\n" + "=" * 60)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Health Check: {health['status']}")
        print(f"✓ Hand Recognition: {hand_result.get('prediction', 'Unknown')}")
        print(f"✓ Face Emotion: {face_result.get('emotion', 'neutral')}")
        if llm_result:
            print(f"✓ LLM Composition: {llm_result.get('sentence', 'No sentence generated')}")
        
        print("\nExpected Behavior:")
        print("- If models are loaded: Real predictions/emotions")
        print("- If models are missing: 'Unknown' for hand, 'neutral' for face")
        print("- LLM always generates contextual sentences")
        
    else:
        print("\nIntegration test incomplete - component failures detected")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to server. Make sure Flask app is running on http://localhost:5000")
    except Exception as e:
        print(f"Test error: {e}")
