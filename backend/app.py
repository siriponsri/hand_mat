#!/usr/bin/env python3
"""
HandMat Backend API
Flask application providing sign language recognition endpoints
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.simple_config import settings
from core.logging import setup_logging
from core.errors import register_error_handlers
from api.health import health_bp
from api.recognize import recognize_bp
from api.face_simple import face_bp
from api.compose import compose_bp

def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Setup CORS
    CORS(app, origins=settings.CORS_ORIGINS)
    
    # Setup logging
    setup_logging(app)
    
    # Register error handlers
    register_error_handlers(app)
    
        # Register blueprints
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(recognize_bp, url_prefix='/api')
    app.register_blueprint(face_bp, url_prefix='/api')
    app.register_blueprint(compose_bp, url_prefix='/api')
    
    @app.route('/')
    def root():
        return jsonify({
            "service": "handmat-backend",
            "version": "1.0.0",
            "status": "running",
            "timestamp": datetime.utcnow().isoformat(),
            "endpoints": {
                "health": "/health",
                "recognize": "/api/recognize",
                "compose": "/api/compose"
            }
        })
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(
        debug=settings.DEBUG,
        host='0.0.0.0',
        port=5000
    )