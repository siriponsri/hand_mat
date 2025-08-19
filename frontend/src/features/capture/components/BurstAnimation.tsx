import React, { useEffect, useState } from 'react';

interface BurstAnimationProps {
  count: number;
  duration?: number; // Animation duration in ms
}

export function BurstAnimation({ count, duration = 2000 }: BurstAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (count > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [count, duration]);

  if (!isVisible || count === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div 
        className="text-2xl font-bold text-accent animate-ping"
        style={{
          animation: 'burst-pulse 0.6s ease-out'
        }}
      >
        +{count}
      </div>
      
      <style jsx>{`
        @keyframes burst-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}