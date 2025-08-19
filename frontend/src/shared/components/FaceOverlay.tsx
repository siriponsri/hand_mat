import React from 'react';
import { FaceDetectionState } from '@/config';
import { ROI } from '@/services/faceStateMachine';
import { FaceDetection } from '@/services/faceDetection';

interface FaceOverlayProps {
  videoWidth: number;
  videoHeight: number;
  roi: ROI;
  currentState: FaceDetectionState;
  captureProgress: number;
  lastDetection: FaceDetection | null;
  isInROI: boolean;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  videoWidth,
  videoHeight,
  roi,
  currentState,
  captureProgress,
  lastDetection,
  isInROI,
}) => {
  const getROIColor = () => {
    switch (currentState) {
      case FaceDetectionState.SEARCHING:
        return 'rgba(156, 163, 175, 0.6)'; // gray
      case FaceDetectionState.TRACKING:
        return 'rgba(59, 130, 246, 0.6)'; // blue
      case FaceDetectionState.STABLE:
        return 'rgba(34, 197, 94, 0.6)'; // green
      case FaceDetectionState.CAPTURE:
        return 'rgba(34, 197, 94, 0.8)'; // bright green
      case FaceDetectionState.COOLDOWN:
        return 'rgba(245, 158, 11, 0.6)'; // orange
      default:
        return 'rgba(156, 163, 175, 0.6)';
    }
  };

  const getFaceBoxColor = () => {
    if (!lastDetection) return 'transparent';
    return isInROI ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
  };

  const getStatusText = () => {
    switch (currentState) {
      case FaceDetectionState.SEARCHING:
        return 'Looking for face...';
      case FaceDetectionState.TRACKING:
        return 'Face detected';
      case FaceDetectionState.STABLE:
        return 'Face stable - preparing capture';
      case FaceDetectionState.CAPTURE:
        return 'Capturing face!';
      case FaceDetectionState.COOLDOWN:
        return 'Cooldown period';
      default:
        return '';
    }
  };

  // Calculate circle properties for progress indicator
  const circleRadius = 20;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference - (captureProgress * circleCircumference);

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: videoWidth, height: videoHeight }}
    >
      {/* ROI Box */}
      <div
        className="absolute border-2 border-dashed rounded-lg transition-colors duration-300"
        style={{
          left: roi.x,
          top: roi.y,
          width: roi.width,
          height: roi.height,
          borderColor: currentState === 'STABLE' ? 'var(--brand)' : 'hsl(var(--muted-foreground))',
        }}
      >
        {/* ROI Label */}
        <div className="absolute -top-6 left-0 bg-overlay text-text text-xs px-2 py-1 rounded border border-border">
          Face Area
        </div>
      </div>

      {/* Face Detection Box */}
      {lastDetection && (
        <div
          className="absolute border-2 rounded transition-colors duration-200"
          style={{
            left: lastDetection.box.x,
            top: lastDetection.box.y,
            width: lastDetection.box.width,
            height: lastDetection.box.height,
            borderColor: getFaceBoxColor(),
          }}
        >
          {/* Confidence Score */}
          <div className="absolute -top-6 left-0 bg-overlay text-text text-xs px-2 py-1 rounded border border-border">
            {Math.round(lastDetection.score * 100)}%
          </div>
        </div>
      )}

      {/* Status Text */}
      <div className="absolute top-4 left-4 bg-overlay text-text px-3 py-2 rounded-lg border border-border">
        <div className="text-sm font-medium">{getStatusText()}</div>
        <div className="text-xs text-muted-foreground mt-1">
          State: {currentState}
        </div>
      </div>

      {/* Progress Circle for Stable State */}
      {currentState === FaceDetectionState.STABLE && (
        <div
          className="absolute"
          style={{
            left: roi.x + roi.width / 2 - 25,
            top: roi.y + roi.height / 2 - 25,
          }}
        >
          <svg width="50" height="50" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="25"
              cy="25"
              r={circleRadius}
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeWidth="3"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="25"
              cy="25"
              r={circleRadius}
              stroke="var(--brand)"
              strokeWidth="3"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={progressOffset}
              className="transition-all duration-100"
            />
          </svg>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
          </div>
        </div>
      )}

      {/* Capture Flash Effect */}
      {currentState === FaceDetectionState.CAPTURE && (
        <div className="absolute inset-0 opacity-50 animate-pulse" style={{ backgroundColor: 'var(--brand)' }} />
      )}
    </div>
  );
};