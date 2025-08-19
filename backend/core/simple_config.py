"""
Simple Configuration without Pydantic
"""
import os

class SimpleSettings:
    """Simple application settings"""
    
    def __init__(self):
        self.DEBUG = True
        self.LOG_LEVEL = "INFO"
        self.MAX_UPLOAD_MB = 10
        self.CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8081"]
        self.MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        
    def is_debug(self):
        return self.DEBUG

def get_upload_limit_bytes():
    """Get upload limit in bytes"""
    return settings.MAX_UPLOAD_MB * 1024 * 1024

# Global settings instance
settings = SimpleSettings()
