"""
Configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Basic app config
    DEBUG: bool = Field(default=True, description="Enable debug mode")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    
    # API Configuration
    MAX_UPLOAD_MB: int = Field(default=10, description="Maximum upload size in MB")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )
    
    # AI/ML Configuration
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key for sentence generation")
    MODEL_PATH: str = Field(default="./models", description="Path to ML model files")
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production", description="Secret key for sessions")
    
    # Performance
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="API rate limit per minute")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Helper functions
def get_upload_limit_bytes() -> int:
    """Get upload limit in bytes"""
    return settings.MAX_UPLOAD_MB * 1024 * 1024

def is_development() -> bool:
    """Check if running in development mode"""
    return settings.DEBUG

def get_model_path(model_name: str) -> str:
    """Get full path to a model file"""
    return os.path.join(settings.MODEL_PATH, model_name)