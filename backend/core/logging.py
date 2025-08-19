"""
Centralized logging configuration
"""

import logging
import sys
import json
import uuid
from datetime import datetime
from flask import Flask, request, g
from core.simple_config import settings

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        
        # Add request context if available
        if hasattr(g, 'request_id'):
            log_data['request_id'] = g.request_id
            
        if request:
            log_data.update({
                'method': request.method,
                'url': request.url,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
            })
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)

def setup_logging(app: Flask):
    """Setup application logging"""
    
    # Create logger
    logger = logging.getLogger('handmat')
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Remove existing handlers
    for handler in logger.handlers:
        logger.removeHandler(handler)
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    
    if settings.DEBUG:
        # Human-readable format for development
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        )
    else:
        # JSON format for production
        formatter = JSONFormatter()
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Add request ID middleware
    @app.before_request
    def before_request():
        g.request_id = str(uuid.uuid4())
        logger.info(f"Request started: {request.method} {request.path}")
    
    @app.after_request
    def after_request(response):
        logger.info(f"Request completed: {response.status_code}")
        return response
    
    # Set Flask's logger to use our configuration
    app.logger.handlers = logger.handlers
    app.logger.setLevel(logger.level)
    
    return logger

# Get logger instance
def get_logger(name: str = 'handmat'):
    """Get a logger instance"""
    return logging.getLogger(name)