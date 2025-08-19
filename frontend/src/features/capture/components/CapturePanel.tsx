import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Square, 
  Zap, 
  Pause, 
  Play,
  AlertCircle
} from 'lucide-react';
import { SignClass, Sample } from '@/types/dataset';
import { TARGET } from '@/config/app';
import { ProgressRing } from './ProgressRing';
import { BurstAnimation } from './BurstAnimation';
import { SampleGallery } from './SampleGallery';
import { useToast } from '@/hooks/use-toast';

interface CaptureState {
  isCapturing: boolean;
  isCountdown: boolean;
  countdownValue: number;
  lastBurstCount: number;
}

interface CaptureControlsProps {
  selectedClass: SignClass | null;
  samples: Sample[];
  onCapture: () => Promise<void>;
  onBurstCapture: (count: number) => Promise<void>;
  onRemoveSample: (sampleId: string) => void;
  disabled?: boolean;
  isAutoMode?: boolean;
  onToggleMode?: () => void;
}

export function CapturePanel({ 
  selectedClass, 
  samples, 
  onCapture, 
  onBurstCapture,
  onRemoveSample,
  disabled = false,
  isAutoMode = false,
  onToggleMode 
}: CaptureControlsProps) {
  const { toast } = useToast();
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    isCountdown: false,
    countdownValue: 0,
    lastBurstCount: 0
  });

  // Get samples for the selected class
  const classSamples = useMemo(() => {
    if (!selectedClass) return [];
    return samples.filter(sample => sample.classId === selectedClass.id);
  }, [samples, selectedClass]);

  const samplesCollected = classSamples.length;

  const handleSingleCapture = useCallback(async () => {
    if (disabled || !selectedClass) return;

    try {
      setCaptureState(prev => ({ ...prev, isCapturing: true }));
      await onCapture();
      
      toast({
        title: "Capture successful",
        description: `Added sample to ${selectedClass.name}`,
      });
    } catch (error) {
      toast({
        title: "Capture failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setCaptureState(prev => ({ ...prev, isCapturing: false }));
    }
  }, [disabled, selectedClass, onCapture, toast]);

  const handleBurstCapture = useCallback(async () => {
    if (disabled || !selectedClass) return;

    const burstCount = TARGET.BURST_COUNT || 5; // Configurable burst count
    
    try {
      setCaptureState(prev => ({ 
        ...prev, 
        isCapturing: true,
        lastBurstCount: burstCount
      }));
      
      await onBurstCapture(burstCount);
      
      toast({
        title: "Burst capture successful", 
        description: `Added ${burstCount} samples to ${selectedClass.name}`,
      });
      
      // Show burst animation
      setTimeout(() => {
        setCaptureState(prev => ({ ...prev, lastBurstCount: 0 }));
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Burst capture failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setCaptureState(prev => ({ ...prev, isCapturing: false }));
    }
  }, [disabled, selectedClass, onBurstCapture, toast]);

  if (!selectedClass) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a class to start capturing</p>
          <p className="text-sm mt-1">Choose from the class list to begin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Capture</h3>
            </div>
            {TARGET.SAMPLES_PER_CLASS > 0 && (
              <Badge variant="outline">
                {samplesCollected}/{TARGET.SAMPLES_PER_CLASS}
              </Badge>
            )}
          </div>
          
          {onToggleMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMode}
              className="gap-2"
            >
              {isAutoMode ? (
                <>
                  <Pause className="h-4 w-4" />
                  Auto
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Manual
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            Class: <span className="font-medium text-foreground">{selectedClass.name}</span>
          </p>
        </div>
      </div>

      {/* Capture Controls */}
      <div className="p-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Main Capture Button with Progress Ring */}
          <div className="relative">
            <ProgressRing
              samplesCollected={samplesCollected}
              className="absolute inset-0 z-10"
            />
            
            <Button
              onClick={handleSingleCapture}
              disabled={disabled || captureState.isCapturing}
              size="lg"
              className="w-24 h-24 rounded-full text-lg font-semibold relative z-20"
              aria-label={`Capture sample for ${selectedClass.name}`}
            >
              {captureState.isCapturing ? (
                <Square className="h-8 w-8" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>

            {/* Burst Animation */}
            {captureState.lastBurstCount > 0 && (
              <BurstAnimation count={captureState.lastBurstCount} />
            )}
          </div>

          {/* Burst Capture Button */}
          <Button
            onClick={handleBurstCapture}
            disabled={disabled || captureState.isCapturing}
            variant="outline"
            size="lg"
            className="gap-2"
            aria-label={`Burst capture for ${selectedClass.name}`}
          >
            <Zap className="h-5 w-5" />
            Burst
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          <p>Single capture or burst mode (5 frames)</p>
          {!isAutoMode && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              <span>Manual mode - click to capture</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Sample Gallery */}
        <SampleGallery
          samples={classSamples}
          onRemoveSample={onRemoveSample}
          className="mt-4"
        />
      </div>
    </Card>
  );
}