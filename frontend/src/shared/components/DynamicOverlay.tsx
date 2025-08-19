import React from 'react';
import { DetectionState, HandDetection, FaceDetection, DETECT } from '@/config';

interface DynamicOverlayProps {
  videoWidth: number;
  videoHeight: number;
  currentState: DetectionState;
  face: FaceDetection | null;
  hand: HandDetection | null;
  countdownProgress: number;
}

export const DynamicOverlay: React.FC<DynamicOverlayProps> = ({
  videoWidth,
  videoHeight,
  currentState,
  face,
  hand,
  countdownProgress,
}) => {
  const shouldShowOverlays = [
    DetectionState.LOCK_FACE,
    DetectionState.LOCK_HAND,
    DetectionState.LOCK_BOTH,
    DetectionState.STABLE,
    DetectionState.COUNTDOWN
  ].includes(currentState);

  if (!shouldShowOverlays) return null;

  const getStateColor = () => {
    switch (currentState) {
      case DetectionState.LOCK_FACE:
      case DetectionState.LOCK_HAND:
        return 'var(--brand)';
      case DetectionState.LOCK_BOTH:
        return 'var(--brand-strong)';
      case DetectionState.STABLE:
        return '#10b981'; // green
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusText = () => {
    switch (currentState) {
      case DetectionState.LOCK_FACE:
        return 'Face detected';
      case DetectionState.LOCK_HAND:
        return 'Hand detected';
      case DetectionState.LOCK_BOTH:
        return 'Face & hand detected';
      case DetectionState.STABLE:
        return 'Ready - starting countdown';
      default:
        return '';
    }
  };

  // Calculate circle properties for countdown
  const circleRadius = 15;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference - (countdownProgress * circleCircumference);

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: videoWidth, height: videoHeight }}
    >
      {/* Face Detection Box */}
      {face && (
        <div
          className="absolute border-2 rounded transition-colors duration-200"
          style={{
            left: face.box.x,
            top: face.box.y,
            width: face.box.w,
            height: face.box.h,
            borderColor: getStateColor(),
          }}
        >
          {/* Face Score */}
          <div className="absolute -top-6 left-0 bg-overlay text-text text-xs px-2 py-1 rounded border border-border">
            Face: {Math.round(face.score * 100)}%
          </div>
        </div>
      )}

      {/* Hand Detection Box */}
      {hand && (
        <div
          className="absolute border-2 rounded transition-colors duration-200"
          style={{
            left: hand.box.x,
            top: hand.box.y,
            width: hand.box.w,
            height: hand.box.h,
            borderColor: getStateColor(),
          }}
        >
          {/* Hand Score */}
          <div className="absolute -top-6 left-0 bg-overlay text-text text-xs px-2 py-1 rounded border border-border">
            {hand.handedness}: {Math.round(hand.box.score * 100)}%
          </div>

          {/* Countdown Ring (anchored to hand box) */}
          {currentState === DetectionState.STABLE && countdownProgress > 0 && (
            <div
              className="absolute"
              style={{
                right: -8,
                top: -8,
              }}
            >
              <svg width="32" height="32" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="16"
                  cy="16"
                  r={circleRadius}
                  fill="none"
                  stroke="hsl(var(--muted-foreground) / 0.3)"
                  strokeWidth="2"
                />
                {/* Progress circle */}
                <circle
                  cx="16"
                  cy="16"
                  r={circleRadius}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-100"
                />
              </svg>
              
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Text */}
      <div className="absolute top-4 left-4 bg-overlay text-text px-3 py-2 rounded-lg border border-border">
        <div className="text-sm font-medium">{getStatusText()}</div>
        <div className="text-xs text-muted-foreground mt-1">
          State: {currentState}
        </div>
        {currentState === DetectionState.STABLE && (
          <div className="text-xs text-brand mt-1">
            Capturing in {((1 - countdownProgress) * (DETECT.AUTO_CAPTURE_DELAY_MS / 1000)).toFixed(1)}s
          </div>
        )}
      </div>

      {/* Hand Landmarks (optional, for debugging) */}
      {hand && hand.landmarks && false && (
        <div>
          {hand.landmarks.map((landmark, index) => (
            <div
              key={index}
              className="absolute w-1 h-1 bg-brand rounded-full"
              style={{
                left: landmark.x - 2,
                top: landmark.y - 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};