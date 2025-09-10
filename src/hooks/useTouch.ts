import { useState, useCallback, useRef, useEffect } from 'react';

interface TouchState {
  isTouching: boolean;
  touchStart: { x: number; y: number } | null;
  touchCurrent: { x: number; y: number } | null;
  delta: { x: number; y: number } | null;
  velocity: { x: number; y: number } | null;
}

interface UseTouchOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventDefault?: boolean;
}

export function useTouch(options: UseTouchOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    preventDefault = true
  } = options;

  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    touchStart: null,
    touchCurrent: null,
    delta: null,
    velocity: null
  });

  const touchStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTouchTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchState({
      isTouching: true,
      touchStart: { x: touch.clientX, y: touch.clientY },
      touchCurrent: { x: touch.clientX, y: touch.clientY },
      delta: null,
      velocity: null
    });

    touchStartTime.current = now;
    lastTouchTime.current = now;

    // Set up long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay, preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchState(prev => {
      if (!prev.touchStart) return prev;

      const delta = {
        x: touch.clientX - prev.touchStart.x,
        y: touch.clientY - prev.touchStart.y
      };

      const velocity = {
        x: (touch.clientX - (prev.touchCurrent?.x || prev.touchStart.x)) / (now - lastTouchTime.current),
        y: (touch.clientY - (prev.touchCurrent?.y || prev.touchStart.y)) / (now - lastTouchTime.current)
      };

      lastTouchTime.current = now;

      return {
        ...prev,
        touchCurrent: { x: touch.clientX, y: touch.clientY },
        delta,
        velocity
      };
    });

    // Cancel long press if moved too much
    if (longPressTimer.current && Math.abs(touch.clientX - (touchState.touchStart?.x || 0)) > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [touchState.touchStart, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const now = Date.now();
    const touchDuration = now - touchStartTime.current;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setTouchState(prev => {
      if (!prev.touchStart || !prev.delta) return prev;

      const { delta, velocity } = prev;
      const absX = Math.abs(delta.x);
      const absY = Math.abs(delta.y);

      // Determine if it's a swipe or tap
      if (absX < swipeThreshold && absY < swipeThreshold) {
        // It's a tap
        if (onTap && touchDuration < 300) {
          onTap();
        }
      } else {
        // It's a swipe
        if (absX > absY) {
          // Horizontal swipe
          if (delta.x > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (delta.y > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      return {
        isTouching: false,
        touchStart: null,
        touchCurrent: null,
        delta: null,
        velocity: null
      };
    });
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, swipeThreshold, preventDefault]);

  const handleTouchCancel = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setTouchState({
      isTouching: false,
      touchStart: null,
      touchCurrent: null,
      delta: null,
      velocity: null
    });
  }, [preventDefault]);

  const bindTouchEvents = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventDefault]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return {
    touchState,
    bindTouchEvents
  };
}