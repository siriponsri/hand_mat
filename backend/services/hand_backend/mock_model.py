"""
Mock hand model for development and testing
"""

import random
import time
import numpy as np
from typing import List, Dict, Any
from .base_model import BaseHandModel

class MockHandModel(BaseHandModel):
    """Mock implementation of hand recognition model"""
    
    def __init__(self):
        self.name = "MockHandModel"
        self.version = "1.0.0-dev"
        # Updated classes to include Thai words and Unknown fallback
        self.classes = [
            "สวัสดี",  # Hello in Thai
            "ฉัน",     # I/Me in Thai  
            "กิน",     # Eat in Thai
            "Unknown", # Fallback for unrecognized gestures
            "hello", "world", "thank", "you", "please", "sorry", "yes", "no",
            "good", "bad", "happy", "sad", "love", "family", "friend", "help",
            "water", "food", "home", "work", "school", "car", "time", "day",
            "night", "sun", "moon", "red", "blue", "green", "big", "small"
        ]
        
    def predict(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generate mock predictions for development
        
        Args:
            image: Input image as numpy array
            
        Returns:
            List of prediction dictionaries
        """
        # Simulate processing time
        time.sleep(random.uniform(0.1, 0.3))
        
        # 30% chance to return "Unknown" as primary result (simulating unrecognized gesture)
        if random.random() < 0.3:
            return [{
                "label": "Unknown",
                "confidence": round(random.uniform(0.60, 0.85), 3),
                "probability": round(random.uniform(0.60, 0.85), 3)
            }]
        
        # Otherwise, prioritize Thai words (70% chance for Thai, 30% for English)
        thai_words = ["สวัสดี", "ฉัน", "กิน"]
        english_words = [cls for cls in self.classes if cls not in thai_words and cls != "Unknown"]
        
        predictions = []
        used_classes = []
        
        for i in range(3):
            # First prediction: prefer Thai words
            if i == 0 and random.random() < 0.7:
                available_thai = [w for w in thai_words if w not in used_classes]
                if available_thai:
                    class_name = random.choice(available_thai)
                else:
                    class_name = random.choice([w for w in english_words if w not in used_classes])
            else:
                # Subsequent predictions: mix of remaining classes
                available_classes = [cls for cls in self.classes if cls not in used_classes and cls != "Unknown"]
                if not available_classes:
                    break
                class_name = random.choice(available_classes)
            
            used_classes.append(class_name)
            
            # Generate confidence (highest for first prediction)
            if i == 0:
                confidence = random.uniform(0.75, 0.95)
            elif i == 1:
                confidence = random.uniform(0.50, 0.85)
            else:
                confidence = random.uniform(0.20, 0.65)
            
            predictions.append({
                "label": class_name,
                "confidence": round(confidence, 3),
                "probability": round(confidence, 3)  # Alias for confidence
            })
        
        # Sort by confidence (highest first)
        predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return predictions
    
    def get_name(self) -> str:
        """Get model name"""
        return self.name
    
    def get_version(self) -> str:
        """Get model version"""
        return self.version
    
    def get_classes(self) -> List[str]:
        """Get list of supported classes"""
        return self.classes.copy()
    
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        return True
    
    def get_info(self) -> Dict[str, Any]:
        """Get detailed model information"""
        return {
            "name": self.name,
            "version": self.version,
            "type": "mock",
            "classes_count": len(self.classes),
            "classes": self.classes,
            "loaded": self.is_loaded(),
            "description": "Mock model for development and testing purposes"
        }