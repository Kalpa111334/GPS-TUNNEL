import React, { useRef, useState, useCallback } from 'react';

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  threshold?: number;
  className?: string;
}

export const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  threshold = 50,
  className = ''
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const [touches, setTouches] = useState<TouchList | null>(null);
  const [lastDistance, setLastDistance] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    if (e.touches.length === 1) {
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: now
      });

      // Double tap detection
      if (onDoubleTap && now - lastTap < 300) {
        onDoubleTap();
        setLastTap(0);
      } else {
        setLastTap(now);
      }
    } else if (e.touches.length === 2 && onPinch) {
      setTouches(e.touches);
      setLastDistance(getDistance(e.touches[0], e.touches[1]));
    }
  }, [onDoubleTap, lastTap, onPinch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && onPinch && touches) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / lastDistance;
      
      if (scale !== 1) {
        onPinch(scale);
        setLastDistance(currentDistance);
      }
    }
  }, [onPinch, touches, lastDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || e.touches.length > 0) {
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;
    
    // Only consider it a swipe if it's fast enough and long enough
    if (deltaTime > 500) {
      setTouchStart(null);
      return;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > threshold && absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    setTouchStart(null);
    setTouches(null);
  }, [touchStart, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <div
      ref={containerRef}
      className={`touch-manipulation touch-pan-x touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
