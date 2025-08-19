"""
Health check endpoints
"""

from flask import Blueprint, jsonify
from datetime import datetime
import psutil
import os
from core.simple_config import settings

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    """Basic health check"""
    return jsonify({
        "status": "healthy",
        "service": "handmat-backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

@health_bp.route('/health/detailed')
def detailed_health_check():
    """Detailed health check with system info"""
    try:
        # Get system metrics
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            "status": "healthy",
            "service": "handmat-backend",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100
                }
            },
            "config": {
                "debug": settings.DEBUG,
                "max_upload_mb": settings.MAX_UPLOAD_MB,
                "model_path_exists": os.path.exists(settings.MODEL_PATH)
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "service": "handmat-backend", 
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }), 503