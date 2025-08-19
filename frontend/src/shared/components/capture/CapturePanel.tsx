import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SignClass, Sample, QualityMetrics } from '@/types/dataset';
import { CONFIG, TARGET } from '@/config';
import { DynamicOverlay } from '@/components/DynamicOverlay';
import { UnifiedDetectionService } from '@/services/unifiedDetection';
import { ProgressRing } from '@/components/capture/ProgressRing';
import { BurstAnimation } from '@/components/capture/BurstAnimation';
import { calculateBlurScore, getBlurStatus, extractImageData } from '@/lib/quality/blur';
import { calculateBrightness, getBrightnessStatus } from '@/lib/quality/brightness';
import { motionDetector, getMotionStatus } from '@/lib/quality/motion';
import { settingsManager } from '@/services/settings';
import { Camera, Circle, Square, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaptureState {
  isCapturing: boolean;
  isBurstCapturing: boolean;
  burstCount: number;
  burstProgress: number;
}

interface CapturePanelProps {
  selectedClass: SignClass | null;
  samplesCollected: number;
  onSampleCaptured: (samples: Sample[]) => void;
}

export function CapturePanel({ selectedClass, samplesCollected, onSampleCaptured }: CapturePanelProps) {
  const webcamRef = useRef<Webcam>(null);
  const detectionServiceRef = useRef<UnifiedDetectionService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    isBurstCapturing: false,
    burstCount: 0,
    burstProgress: 0,
  });
  
  const [detection, setDetection] = useState<any>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    blurVar: 0,
    brightness: 0,
    motionScore: 0,
  });
  
  const [showBurstAnimation, setShowBurstAnimation] = useState<number | null>(null);
  
  const [detectionStatus, setDetectionStatus] = useState({
    handsAvailable: false,
    faceAvailable: false,
    initialized: false,
  });

  const { toast } = useToast();

  // Initialize detection service
  useEffect(() => {
    const initDetection = async () => {
      try {
        detectionServiceRef.current = new UnifiedDetectionService();
        await detectionServiceRef.current.initialize();
        setDetectionStatus(prev => ({ ...prev, initialized: true }));
      } catch (error) {
        console.error('Failed to initialize detection:', error);
        toast({
          title: "Detection Error",
          description: "Failed to initialize hand/face detection",
          variant: "destructive",
        });
      }
    };

    initDetection();

    return () => {
      if (detectionServiceRef.current) {
        detectionServiceRef.current.cleanup();
      }
    };
  }, [toast]);

  // Quality monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current?.video && canvasRef.current) {
        updateQualityMetrics();
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const updateQualityMetrics = useCallback(() => {
    if (!webcamRef.current?.video || !canvasRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = extractImageData(canvas);
      
      const blurVar = calculateBlurScore(imageData);
      const brightness = calculateBrightness(imageData);
      const motionScore = motionDetector.calculateMotionScore(imageData);
      
      setQualityMetrics({ blurVar, brightness, motionScore });
    } catch (error) {
      console.warn('Quality analysis failed:', error);
    }
  }, []);

  const captureImage = useCallback(async (): Promise<Blob | null> => {
    if (!webcamRef.current) return null;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return null;

    // Convert data URL to blob
    const response = await fetch(imageSrc);
    return await response.blob();
  }, []);

  const createSample = useCallback((blob: Blob): Sample => {
    const canvas = canvasRef.current;
    const dimensions = canvas ? { w: canvas.width, h: canvas.height } : { w: 640, h: 480 };

    return {
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      classId: selectedClass!.id,
      blob,
      ...dimensions,
      ts: new Date().toISOString(),
      mirrored: settingsManager.mirrorCapture,
      blurVar: qualityMetrics.blurVar,
      brightness: qualityMetrics.brightness,
      motionScore: qualityMetrics.motionScore,
    };
  }, [selectedClass, qualityMetrics]);

  const handleSingleCapture = useCallback(async () => {
    if (!selectedClass || captureState.isCapturing) return;

    setCaptureState(prev => ({ ...prev, isCapturing: true }));

    try {
      const blob = await captureImage();
      if (blob) {
        const sample = createSample(blob);
        onSampleCaptured([sample]);
        
        toast({
          title: "Sample Captured",
          description: `Added to "${selectedClass.label_en}"`,
        });
      }
    } catch (error) {
      console.error('Capture failed:', error);
      toast({
        title: "Capture Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setCaptureState(prev => ({ ...prev, isCapturing: false }));
    }
  }, [selectedClass, captureState.isCapturing, captureImage, createSample, onSampleCaptured, toast]);

  const handleBurstCapture = useCallback(async () => {
    if (!selectedClass || captureState.isBurstCapturing) return;

    setCaptureState(prev => ({ 
      ...prev, 
      isBurstCapturing: true, 
      burstCount: 0,
      burstProgress: 0,
    }));

    const samples: Sample[] = [];
    
    for (let i = 0; i < CONFIG.BURST_FRAMES; i++) {
      try {
        const blob = await captureImage();
        if (blob) {
          const sample = createSample(blob);
          samples.push(sample);
        }
        
        setCaptureState(prev => ({ 
          ...prev, 
          burstCount: i + 1,
          burstProgress: ((i + 1) / CONFIG.BURST_FRAMES) * 100,
        }));
        
        // Wait between captures
        if (i < CONFIG.BURST_FRAMES - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.BURST_SPACING_MS));
        }
      } catch (error) {
        console.error(`Burst capture ${i + 1} failed:`, error);
      }
    }

    onSampleCaptured(samples);
    
    // Show burst animation
    if (samples.length > 0) {
      setShowBurstAnimation(samples.length);
    }
    
    toast({
      title: "Burst Capture Complete",
      description: `Captured ${samples.length} samples for "${selectedClass.label_en}"`,
    });

    setCaptureState(prev => ({ 
      ...prev, 
      isBurstCapturing: false, 
      burstCount: 0,
      burstProgress: 0,
    }));
  }, [selectedClass, captureState.isBurstCapturing, captureImage, createSample, onSampleCaptured, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        if (event.type === 'keydown') {
          // Start burst capture on space down
          if (!captureState.isBurstCapturing && selectedClass) {
            burstTimeoutRef.current = setTimeout(() => {
              handleBurstCapture();
            }, 500); // 500ms hold to start burst
          }
        } else if (event.type === 'keyup') {
          // Single capture on space up (if not burst)
          if (burstTimeoutRef.current) {
            clearTimeout(burstTimeoutRef.current);
            burstTimeoutRef.current = null;
            handleSingleCapture();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyPress);
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
    };
  }, [handleSingleCapture, handleBurstCapture, captureState.isBurstCapturing, selectedClass]);

  const getVideoConstraints = () => ({
    width: 1280,
    height: 720,
    facingMode: 'user',
  });

  const getQualityStatus = (metric: keyof QualityMetrics) => {
    const thresholds = CONFIG.QUALITY_THRESHOLDS;
    
    switch (metric) {
      case 'blurVar':
        return getBlurStatus(qualityMetrics.blurVar, thresholds.BLUR_MIN);
      case 'brightness':
        return getBrightnessStatus(qualityMetrics.brightness, thresholds.BRIGHTNESS_MIN, thresholds.BRIGHTNESS_MAX);
      case 'motionScore':
        return getMotionStatus(qualityMetrics.motionScore, thresholds.MOTION_MAX);
      default:
        return 'good';
    }
  };

  const QualityIndicator = ({ metric, label }: { metric: keyof QualityMetrics; label: string }) => {
    const status = getQualityStatus(metric);
    const value = qualityMetrics[metric];
    
    const Icon = status === 'good' ? CheckCircle : status === 'warning' ? AlertTriangle : XCircle;
    const color = status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500';
    
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center gap-1 ${color}`}>
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {value.toFixed(1)} ({status})</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Selected Class Indicator */}
          {selectedClass ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-surface border">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedClass.color }}
              />
              <span className="font-medium">Capturing: {selectedClass.label_en}</span>
              {selectedClass.label_th && (
                <span className="text-sm text-muted-foreground">({selectedClass.label_th})</span>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted text-center">
              <p className="text-muted-foreground">Select a class to start capturing</p>
            </div>
          )}

          {/* Camera Feed */}
          <div className="relative camera-container">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={getVideoConstraints()}
              mirrored={settingsManager.mirrorPreview}
              className="w-full rounded-xl"
            />
            
            {/* Detection Overlay - Disabled for manual capture */}
            {CONFIG.FEATURE_FLAGS.ENABLE_ROI_ASSIST && detection && (
              <div className="absolute inset-0 pointer-events-none">
                {/* ROI overlay will be added later */}
              </div>
            )}

            {/* Quality Indicators */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <QualityIndicator metric="blurVar" label="Blur" />
              <QualityIndicator metric="brightness" label="Light" />
              <QualityIndicator metric="motionScore" label="Motion" />
            </div>

            {/* Burst Progress */}
            {captureState.isBurstCapturing && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-surface/90 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className="h-4 w-4 text-brand animate-pulse" />
                    <span className="text-sm font-medium">
                      Burst Capture {captureState.burstCount}/{CONFIG.BURST_FRAMES}
                    </span>
                  </div>
                  <Progress value={captureState.burstProgress} className="h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Capture Controls */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Button
                onClick={handleSingleCapture}
                disabled={!selectedClass || captureState.isCapturing || captureState.isBurstCapturing}
                className="w-full bg-brand hover:bg-brand-strong text-white relative"
                size="lg"
              >
                {/* Progress Ring Wrapper */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <ProgressRing 
                    samplesCollected={samplesCollected} 
                    className="w-16 h-16 opacity-60"
                  />
                </div>
                
                {/* Button Content */}
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <span>
                    {captureState.isCapturing ? 'Capturing...' : 'Capture (Space)'}
                  </span>
                </div>
              </Button>
              
              {/* Burst Animation */}
              {showBurstAnimation && (
                <BurstAnimation 
                  count={showBurstAnimation}
                  onComplete={() => setShowBurstAnimation(null)}
                />
              )}
            </div>
            
            <Button
              onClick={handleBurstCapture}
              disabled={!selectedClass || captureState.isCapturing || captureState.isBurstCapturing}
              variant="outline"
              size="lg"
            >
              <Square className="h-5 w-5 mr-2" />
              Burst ({CONFIG.BURST_FRAMES})
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to capture</p>
            <p>Hold <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> for burst mode</p>
            {!selectedClass && <p className="text-destructive">Select a class to enable capture</p>}
          </div>
        </div>

        {/* Hidden canvas for quality analysis */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}