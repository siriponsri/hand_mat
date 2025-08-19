#!/usr/bin/env python3
"""
HandMat Development Server Launcher
Starts both Frontend (Vite) and Backend (Flask) with colored, prefixed logs
"""

import subprocess
import sys
import os
import signal
import threading
import time
from typing import Optional

# Color codes for terminal output
class Colors:
    FRONTEND = '\033[94m'  # Blue
    BACKEND = '\033[92m'   # Green
    ERROR = '\033[91m'     # Red
    WARNING = '\033[93m'   # Yellow
    RESET = '\033[0m'      # Reset
    BOLD = '\033[1m'       # Bold

def print_colored(prefix: str, message: str, color: str = Colors.RESET):
    """Print message with colored prefix"""
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {prefix}{Colors.RESET} {message}")

def run_frontend():
    """Run the frontend development server"""
    try:
        print_colored("FRONTEND", "Starting Vite development server on port 8080...", Colors.FRONTEND)
        
        # Get current directory and navigate to root 
        original_dir = os.getcwd()
        
        # Try different npm commands based on OS
        npm_cmd = "npm"
        if os.name == 'nt':  # Windows
            npm_cmd = "npm.cmd"
        
        # Start Vite dev server from root directory (vite config points to frontend)
        process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            cwd=original_dir
        )
        
        # Stream output with prefix
        for line in iter(process.stdout.readline, ''):
            if line.strip():
                print_colored("FRONTEND", line.strip(), Colors.FRONTEND)
                
        process.wait()
        
    except FileNotFoundError:
        print_colored("ERROR", "npm not found. Please install Node.js and npm.", Colors.ERROR)
        sys.exit(1)
    except Exception as e:
        print_colored("ERROR", f"Frontend failed to start: {e}", Colors.ERROR)
        sys.exit(1)

def run_backend():
    """Run the backend development server"""
    try:
        print_colored("BACKEND", "Starting Flask development server on port 5000...", Colors.BACKEND)
        
        # Get current directory 
        original_dir = os.getcwd()
        
        # Use the configured Python environment
        python_exe = os.path.join(original_dir, ".venv", "Scripts", "python.exe")
        if not os.path.exists(python_exe):
            # Fallback to system python
            python_exe = "python"
        
        app_path = os.path.join(original_dir, "backend", "app.py")
        
        # Start Flask dev server
        process = subprocess.Popen(
            [python_exe, app_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            cwd=original_dir
        )
        
        # Stream output with prefix
        for line in iter(process.stdout.readline, ''):
            if line.strip():
                print_colored("BACKEND", line.strip(), Colors.BACKEND)
                
        process.wait()
        
    except FileNotFoundError:
        print_colored("ERROR", "Python not found. Please install Python 3.8+.", Colors.ERROR)
        sys.exit(1)
    except Exception as e:
        print_colored("ERROR", f"Backend failed to start: {e}", Colors.ERROR)
        sys.exit(1)

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    print_colored("SYSTEM", "Shutting down servers...", Colors.WARNING)
    sys.exit(0)

def main():
    """Main function to start both servers"""
    print_colored("SYSTEM", f"{Colors.BOLD}🚀 Starting HandMat Development Environment", Colors.RESET)
    print_colored("SYSTEM", "Frontend: http://localhost:8080", Colors.FRONTEND)
    print_colored("SYSTEM", "Backend:  http://localhost:5000", Colors.BACKEND)
    print_colored("SYSTEM", "Press Ctrl+C to stop both servers", Colors.WARNING)
    print("-" * 60)
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Create backend directory if it doesn't exist
    os.makedirs("backend", exist_ok=True)
    
    # Start both servers in separate threads
    frontend_thread = threading.Thread(target=run_frontend, daemon=True)
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    
    try:
        frontend_thread.start()
        time.sleep(1)  # Small delay to avoid log mixing
        backend_thread.start()
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
            # Check if threads are still alive
            if not frontend_thread.is_alive():
                print_colored("ERROR", "Frontend server died unexpectedly", Colors.ERROR)
                sys.exit(1)
                
            if not backend_thread.is_alive():
                print_colored("ERROR", "Backend server died unexpectedly", Colors.ERROR)
                sys.exit(1)
                
    except KeyboardInterrupt:
        print_colored("SYSTEM", "Received shutdown signal", Colors.WARNING)
        sys.exit(0)

if __name__ == "__main__":
    main()