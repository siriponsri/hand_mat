import React, { useState, useEffect } from 'react';

interface BurstAnimationProps {
  count: number;
  onComplete: () => void;
}

export function BurstAnimation({ count, onComplete }: BurstAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 150); // Wait for fade out
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div className="absolute -top-2 -right-2 animate-fade-in">
      <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-scale-in">
        +{count}
      </div>
    </div>
  );
}