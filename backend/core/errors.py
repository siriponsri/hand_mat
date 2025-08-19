"""
Centralized error handling for the Flask application
"""

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException
from core.logging import get_logger

logger = get_logger(__name__)

class HandmatError(Exception):
    """Base exception for Handmat application"""
    status_code = 500
    message = "An unexpected error occurred"
    
    def __init__(self, message=None, status_code=None):
        self.message = message or self.message
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)

class ValidationError(HandmatError):
    """Validation error"""
    status_code = 400
    message = "Invalid input data"

class FileTooLargeError(HandmatError):
    """File too large error"""
    status_code = 413
    message = "File size exceeds maximum allowed limit"

class UnsupportedFileTypeError(HandmatError):
    """Unsupported file type error"""
    status_code = 415
    message = "Unsupported file type. Please upload a valid image file"

class RateLimitError(HandmatError):
    """Rate limit exceeded error"""
    status_code = 429
    message = "Rate limit exceeded. Please try again later"

class ModelError(HandmatError):
    """ML model error"""
    status_code = 503
    message = "Model service temporarily unavailable"

def register_error_handlers(app: Flask):
    """Register error handlers for the application"""
    
    @app.errorhandler(HandmatError)
    def handle_handmat_error(error):
        """Handle custom application errors"""
        logger.error(f"Application error: {error.message}", exc_info=True)
        return jsonify({
            "error": {
                "type": error.__class__.__name__,
                "message": error.message,
                "status_code": error.status_code
            },
            "success": False
        }), error.status_code
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP exceptions"""
        logger.warning(f"HTTP error {error.code}: {error.description}")
        
        # Custom messages for common errors
        messages = {
            400: "Bad request. Please check your input data",
            401: "Authentication required",
            403: "Access forbidden",
            404: "Resource not found",
            405: "Method not allowed",
            413: "File too large. Maximum size is 10MB",
            415: "Unsupported media type. Please upload a valid image",
            429: "Too many requests. Please slow down",
            500: "Internal server error. Our team has been notified",
            502: "Bad gateway. Service temporarily unavailable",
            503: "Service unavailable. Please try again later"
        }
        
        return jsonify({
            "error": {
                "type": "HTTPError",
                "message": messages.get(error.code, error.description),
                "status_code": error.code
            },
            "success": False
        }), error.code
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)
        
        return jsonify({
            "error": {
                "type": "UnexpectedError", 
                "message": "An unexpected error occurred. Our team has been notified",
                "status_code": 500
            },
            "success": False
        }), 500