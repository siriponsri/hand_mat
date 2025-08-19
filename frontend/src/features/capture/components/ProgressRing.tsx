import React from 'react';
import { TARGET } from '@/config/app';

interface ProgressRingProps {
  samplesCollected: number;
  className?: string;
}

export function ProgressRing({ samplesCollected, className = '' }: ProgressRingProps) {
  const target = TARGET.SAMPLES_PER_CLASS;
  
  // Hide ring if target is 0
  if (target === 0) return null;
  
  const percentage = Math.min(samplesCollected / target, 1);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference * (1 - percentage);
  
  // Determine color based on progress
  const getProgressColor = () => {
    if (percentage >= 1) return 'text-green-500';
    if (percentage >= TARGET.WARN_THRESHOLD) return 'text-accent';
    return 'text-brand';
  };
  
  const getStrokeColor = () => {
    if (percentage >= 1) return 'stroke-green-500';
    if (percentage >= TARGET.WARN_THRESHOLD) return 'stroke-accent';
    return 'stroke-brand';
  };
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={`Progress: ${samplesCollected} of ${target}`}
      role="progressbar"
      aria-valuenow={samplesCollected}
      aria-valuemax={target}
    >
      {/* SVG Ring */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border opacity-20"
        />
        
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={`transition-all duration-300 ${getStrokeColor()}`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${getProgressColor()}`}>
        <div className="text-sm font-bold leading-none">
          {samplesCollected}
        </div>
        <div className="text-xs opacity-70 leading-none">
          {target}
        </div>
      </div>
    </div>
  );
}