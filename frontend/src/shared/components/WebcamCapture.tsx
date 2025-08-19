import React, { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from './ui/button';
import { DynamicOverlay } from './DynamicOverlay';
import { UnifiedDetectionService } from '../services/unifiedDetection';
import { DetectionState, UnifiedDetection, DETECT } from '../config/app';
import { settingsManager } from '../services/settings';
import { useToast } from '../hooks/use-toast';
import { Camera, Pause, Play, AlertCircle, RotateCcw, FlipHorizontal } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageSrc: string, faceImageSrc?: string) => void;
  isCapturing: boolean;
  holdDuration?: number;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  isCapturing,
  holdDuration = 2000,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const detectionServiceRef = useRef<UnifiedDetectionService | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const [detection, setDetection] = useState<UnifiedDetection>({
    face: null,
    hand: null,
    state: DetectionState.SEARCHING,
    stableStartTime: 0,
    countdownStartTime: 0,
    lastCaptureTime: 0
  });
  const [detectionStatus, setDetectionStatus] = useState<{
    hand: boolean;
    face: boolean;
  }>({ hand: false, face: false });
  const [isPaused, setIsPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize detection services
  useEffect(() => {
    const initializeDetection = async () => {
      try {
        setIsLoading(true);
        console.log('Starting detection service initialization...');
        
        const service = new UnifiedDetectionService();
        const status = await service.initialize();
        
        detectionServiceRef.current = service;
        setDetectionStatus(status);
        
        if (!status.hand && !status.face) {
          console.warn('Both hand and face detection failed to initialize');
          toast({
            title: "Detection Unavailable",
            description: "Hand and face detection failed to initialize. Manual capture only.",
            variant: "destructive",
          });
        } else if (!status.hand) {
          console.warn('Hand detection failed to initialize');
          toast({
            title: "Hand Detection Unavailable", 
            description: "Hand detection failed. Face detection available.",
            variant: "destructive",
          });
        } else if (!status.face) {
          console.warn('Face detection failed to initialize');
          toast({
            title: "Face Detection Unavailable",
            description: "Face detection failed. Hand detection available.", 
            variant: "destructive",
          });
        } else {
          console.log('Detection services initialized successfully');
          toast({
            title: "Detection Ready",
            description: "Hand and face detection initialized successfully.",
          });
        }
      } catch (error) {
        console.error('Detection initialization error:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize detection services. Check console for details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeDetection();

    return () => {
      if (detectionServiceRef.current) {
        detectionServiceRef.current.cleanup();
      }
    };
  }, [toast]);

  const handleAutoCapture = useCallback(async () => {
    if (!webcamRef.current || isCapturing) return;

    try {
      const video = webcamRef.current.video!;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Apply mirroring if enabled for capture
      if (settingsManager.mirrorCapture) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }

      ctx.drawImage(video, 0, 0);

      // Get full frame as main image
      const fullFrameBlob = await new Promise<string>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.8);
      });

      // Extract face image if detected
      let faceImageBlob: string | undefined;
      if (detection.face) {
        const faceCanvas = document.createElement('canvas');
        const faceCtx = faceCanvas.getContext('2d')!;
        
        const box = detection.face.box;
        const padding = 20; // Add some padding around face
        const cropX = Math.max(0, box.x - padding);
        const cropY = Math.max(0, box.y - padding);
        const cropW = Math.min(video.videoWidth - cropX, box.w + padding * 2);
        const cropH = Math.min(video.videoHeight - cropY, box.h + padding * 2);
        
        faceCanvas.width = cropW;
        faceCanvas.height = cropH;

        if (settingsManager.mirrorCapture) {
          faceCtx.scale(-1, 1);
          faceCtx.translate(-cropW, 0);
        }

        faceCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        faceImageBlob = await new Promise<string>((resolve) => {
          faceCanvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.8);
        });
      }

      onCapture(fullFrameBlob, faceImageBlob);
      
      toast({
        title: "Auto-Capture Complete",
        description: "Frame captured automatically with detection data.",
      });
      
    } catch (error) {
      console.error('Auto-capture failed:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture frame automatically.",
        variant: "destructive",
      });
    }
  }, [detection, isCapturing, onCapture, toast]);

  // Start/stop detection loop
  useEffect(() => {
    if (isPaused || !detectionServiceRef.current) return;

    const runDetection = async () => {
      if (!webcamRef.current?.video || isCapturing) return;

      const video = webcamRef.current.video;
      const now = performance.now();
      
      // Throttle detection to DETECT.POLL_MS
      if (now - lastFrameTimeRef.current < DETECT.POLL_MS) return;
      lastFrameTimeRef.current = now;

      try {
        const currentDetection = await detectionServiceRef.current!.detect(video, now);
        setDetection(currentDetection);

        // Check for auto-capture
        if (detectionServiceRef.current!.shouldCapture()) {
          handleAutoCapture();
        }
      } catch (error) {
        console.warn('Detection error:', error);
      }
    };

    detectionIntervalRef.current = setInterval(runDetection, DETECT.POLL_MS);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isPaused, isCapturing, handleAutoCapture]);

  const handleManualCapture = useCallback(() => {
    if (!webcamRef.current || isCapturing) return;
    handleAutoCapture();
  }, [handleAutoCapture, isCapturing]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    if (detectionServiceRef.current) {
      detectionServiceRef.current.reset();
    }
  }, []);

  const toggleMirror = useCallback(() => {
    settingsManager.mirrorPreview = !settingsManager.mirrorPreview;
    toast({
      title: "Mirror Updated",
      description: `Preview mirror ${settingsManager.mirrorPreview ? 'enabled' : 'disabled'}`,
    });
  }, [toast]);

  const getVideoConstraints = () => ({
    width: 1280,
    height: 720,
    facingMode: "user"
  });

  const handleWebcamUserMedia = useCallback(() => {
    setCameraError(null);
    setIsLoading(false);
    toast({
      title: "Camera Ready",
      description: "Webcam access granted successfully",
    });
  }, [toast]);

  const handleWebcamUserMediaError = useCallback((error: string | DOMException) => {
    setIsLoading(false);
    let errorMessage = "Failed to access camera";
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.name === 'NotAllowedError') {
      errorMessage = "Camera permission denied. Please allow camera access and refresh the page.";
    } else if (error.name === 'NotFoundError') {
      errorMessage = "No camera found. Please connect a camera and refresh the page.";
    } else if (error.name === 'NotReadableError') {
      errorMessage = "Camera is already in use by another application.";
    }
    
    setCameraError(errorMessage);
    toast({
      title: "Camera Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // M key to toggle mirror
      if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.altKey) {
        toggleMirror();
      }
      // Space key to manual capture
      if (event.key === ' ' && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        handleManualCapture();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleMirror, handleManualCapture]);

  const countdownProgress = detectionServiceRef.current?.getCountdownProgress() ?? 0;

  return (
    <div className="space-y-4">
      {/* Status and Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <div>Camera: {cameraError ? '❌ Error' : isLoading ? '⏳ Loading...' : '✅ Ready'}</div>
          <div>Detection: {detectionStatus.hand ? '✓ Hand' : '✗ Hand'} | {detectionStatus.face ? '✓ Face' : '✗ Face'}</div>
          {detection.state !== DetectionState.SEARCHING && (
            <div className="text-brand">• State: {detection.state}</div>
          )}
          <div className="text-xs mt-1">
            Mirror: {settingsManager.mirrorPreview ? '🔄 On' : '⏸️ Off'} | 
            Capture Mirror: {settingsManager.mirrorCapture ? 'On' : 'Off'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMirror}
              className={`transition-all duration-200 ${
                settingsManager.mirrorPreview 
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm" 
                  : "hover:bg-gray-50"
              }`}
            >
              <FlipHorizontal className={`h-4 w-4 mr-1 transition-transform ${
                settingsManager.mirrorPreview ? "scale-110" : ""
              }`} />
              Mirror {settingsManager.mirrorPreview ? 'ON' : 'OFF'}
            </Button>
            
            {/* Mirror Status Indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-colors ${
              settingsManager.mirrorPreview ? "bg-blue-500" : "bg-gray-300"
            }`} />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            disabled={isCapturing}
            className="hover:bg-gray-50"
          >
            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={handleManualCapture}
            disabled={isCapturing}
            size="sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            Manual Capture
          </Button>
        </div>
      </div>

      {/* Webcam Container */}
      <div className="relative rounded-xl overflow-hidden bg-surface border border-border shadow-card">
        {cameraError ? (
          <div className="aspect-video flex items-center justify-center bg-red-50 border-2 border-red-200">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Camera Error</h3>
              <p className="text-red-600 mb-4">{cameraError}</p>
              <Button 
                onClick={() => {
                  setCameraError(null);
                  setIsLoading(true);
                  window.location.reload();
                }}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry Camera Access
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={getVideoConstraints()}
              onUserMedia={handleWebcamUserMedia}
              onUserMediaError={handleWebcamUserMediaError}
              style={{
                width: '100%',
                height: 'auto',
                transform: settingsManager.mirrorPreview ? 'scaleX(-1)' : 'scaleX(1)',
                transition: 'transform 0.3s ease-in-out',
              }}
              className="rounded-lg"
            />

            {/* Mirror indicator overlay */}
            {settingsManager.mirrorPreview && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                🔄 Mirrored
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="text-lg font-medium">Requesting Camera Access...</div>
                  <div className="text-sm opacity-75">Please allow camera permissions</div>
                </div>
              </div>
            )}

            {/* Dynamic Detection Overlays */}
            {webcamRef.current?.video && !isPaused && !isLoading && (
              <DynamicOverlay
                videoWidth={webcamRef.current.video.videoWidth}
                videoHeight={webcamRef.current.video.videoHeight}
                currentState={detection.state}
                face={detection.face}
                hand={detection.hand}
                countdownProgress={countdownProgress}
              />
            )}

            {/* Loading indicator when no detections available */}
            {!detectionStatus.hand && !detectionStatus.face && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-overlay">
                <div className="text-center text-text">
                  <div className="text-lg font-medium">Initializing Detection...</div>
                  <div className="text-sm text-muted-foreground">Please wait while models load</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions and Mirror Controls */}
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">
          <p>Auto-capture will activate when your hand and face are stable for {DETECT.STABILITY_MS}ms</p>
          <p>Countdown: {(DETECT.AUTO_CAPTURE_DELAY_MS / 1000).toFixed(1)}s | Cooldown: {(DETECT.COOLDOWN_MS / 1000).toFixed(1)}s</p>
          <p className="text-xs mt-1 opacity-75">
            💡 Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">M</kbd> = Toggle Mirror, 
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Space</kbd> = Manual Capture
          </p>
        </div>
        
        {/* Additional Mirror Controls */}
        <div className="flex justify-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Preview Mirror:</span>
            <Button
              variant={settingsManager.mirrorPreview ? "default" : "outline"}
              size="sm"
              onClick={toggleMirror}
              className="h-7 px-3"
            >
              {settingsManager.mirrorPreview ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Capture Mirror:</span>
            <Button
              variant={settingsManager.mirrorCapture ? "default" : "outline"}
              size="sm"
              onClick={() => {
                settingsManager.mirrorCapture = !settingsManager.mirrorCapture;
                toast({
                  title: "Capture Mirror Updated",
                  description: `Captured images will ${settingsManager.mirrorCapture ? 'be' : 'not be'} mirrored`,
                });
              }}
              className="h-7 px-3"
            >
              {settingsManager.mirrorCapture ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};