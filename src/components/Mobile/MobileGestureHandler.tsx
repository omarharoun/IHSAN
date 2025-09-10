import React, { useRef, useEffect } from 'react';
import { useTouch } from '../../hooks/useTouch';

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventDefault?: boolean;
  className?: string;
}

export function MobileGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  swipeThreshold = 50,
  longPressDelay = 500,
  preventDefault = true,
  className = ''
}: MobileGestureHandlerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  const { bindTouchEvents } = useTouch({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    swipeThreshold,
    longPressDelay,
    preventDefault
  });

  useEffect(() => {
    const cleanup = bindTouchEvents(elementRef.current);
    return cleanup;
  }, [bindTouchEvents]);

  return (
    <div
      ref={elementRef}
      className={`touch-manipulation ${className}`}
      style={{ touchAction: preventDefault ? 'none' : 'auto' }}
    >
      {children}
    </div>
  );
}