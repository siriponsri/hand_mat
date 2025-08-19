"""
Mock face detection and expression model for development
"""

import random
import time
import numpy as np
from typing import List, Dict, Any
from .base_model import BaseFaceModel

class MockFaceModel(BaseFaceModel):
    """Mock implementation of face detection and expression model"""
    
    def __init__(self):
        self.name = "MockFaceModel"
        self.version = "1.0.0-dev"
        self.expressions = [
            "neutral", "happy", "sad", "angry", 
            "surprised", "fear", "disgust"
        ]
        
    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generate mock face detections
        
        Returns:
            List of mock face detections with realistic bounding boxes
        """
        # Simulate processing time
        time.sleep(random.uniform(0.05, 0.15))
        
        height, width = image.shape[:2]
        
        # Mock 1-2 faces detected (80% chance of detecting a face)
        if random.random() < 0.8:
            num_faces = random.choices([1, 2], weights=[0.9, 0.1])[0]
            faces = []
            
            for i in range(num_faces):
                # Generate realistic face bounding box
                face_width = random.randint(width//8, width//4)
                face_height = int(face_width * 1.2)  # Face is taller than wide
                
                x = random.randint(0, max(1, width - face_width))
                y = random.randint(0, max(1, height - face_height))
                
                # Generate mock landmarks (5 key points: eyes, nose, mouth corners)
                landmarks = []
                for j in range(5):
                    lx = x + random.randint(face_width//4, 3*face_width//4)
                    ly = y + random.randint(face_height//4, 3*face_height//4)
                    landmarks.append([lx, ly])
                
                faces.append({
                    "bbox": [x, y, face_width, face_height],
                    "confidence": random.uniform(0.75, 0.98),
                    "landmarks": landmarks,
                    "face_id": i
                })
            
            return faces
        else:
            return []  # No faces detected
    
    def analyze_expression(self, face_image: np.ndarray) -> Dict[str, Any]:
        """
        Generate mock expression analysis
        """
        # Simulate processing time
        time.sleep(random.uniform(0.1, 0.2))
        
        # Generate realistic emotion scores that sum to ~1.0
        emotions = {}
        remaining_prob = 1.0
        
        for i, emotion in enumerate(self.expressions):
            if i == len(self.expressions) - 1:
                # Last emotion gets remaining probability
                emotions[emotion] = max(0.01, remaining_prob)
            else:
                # Random probability, but favor some emotions
                if emotion == "neutral":
                    prob = random.uniform(0.2, 0.6)  # Neutral is common
                elif emotion == "happy":
                    prob = random.uniform(0.1, 0.4)  # Happy is also common
                else:
                    prob = random.uniform(0.01, 0.2)  # Other emotions less common
                
                prob = min(prob, remaining_prob - 0.01 * (len(self.expressions) - i - 1))
                emotions[emotion] = max(0.01, prob)
                remaining_prob -= emotions[emotion]
        
        # Find dominant expression
        dominant_expression = max(emotions, key=emotions.get)
        confidence = emotions[dominant_expression]
        
        return {
            "expression": dominant_expression,
            "emotions": emotions,
            "confidence": round(confidence, 3)
        }
    
    def analyze_emotion(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Generate mock emotion analysis
        
        Args:
            image: Input image as numpy array
            
        Returns:
            Dictionary with emotion and confidence
        """
        # Simulate processing time
        time.sleep(random.uniform(0.1, 0.2))
        
        # Generate random emotion with realistic distribution
        emotion_weights = {
            "neutral": 0.3,
            "happy": 0.25,
            "sad": 0.15,
            "surprised": 0.15,
            "angry": 0.10,
            "fear": 0.03,
            "disgust": 0.02
        }
        
        # Choose emotion based on weights
        emotions = list(emotion_weights.keys())
        weights = list(emotion_weights.values())
        emotion = np.random.choice(emotions, p=weights)
        
        # Generate confidence based on emotion
        if emotion in ["neutral", "happy"]:
            confidence = random.uniform(0.7, 0.95)
        else:
            confidence = random.uniform(0.6, 0.85)
        
        return {
            "emotion": emotion,
            "confidence": confidence,
            "emotions_detected": [{
                "emotion": emotion,
                "confidence": round(confidence, 3)
            }]
        }
    
    def get_name(self) -> str:
        """Get model name"""
        return self.name
    
    def get_version(self) -> str:
        """Get model version"""
        return self.version
    
    def get_supported_expressions(self) -> List[str]:
        """Get list of supported expression classes"""
        return self.expressions.copy()
    
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """Get detailed model information"""
        return {
            "name": self.name,
            "version": self.version,
            "type": "mock",
            "expressions_count": len(self.expressions),
            "expressions": self.expressions,
            "loaded": self.is_loaded(),
            "description": "Mock face detection and expression model for development"
        }
