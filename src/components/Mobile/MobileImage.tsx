import React, { useState, useRef, useEffect } from 'react';
import { useMobilePerformance } from '../../hooks/useMobilePerformance';

interface MobileImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  lazy?: boolean;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function MobileImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  lazy = true,
  className = '',
  placeholder,
  onLoad,
  onError
}: MobileImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { optimizeImage, lazyLoadImage, isSlowConnection } = useMobilePerformance();

  const optimizedSrc = optimizeImage(src, width, quality);
  const shouldLazyLoad = lazy && !isSlowConnection;

  useEffect(() => {
    if (imgRef.current && shouldLazyLoad) {
      const cleanup = lazyLoadImage(imgRef.current, optimizedSrc);
      return cleanup;
    } else if (imgRef.current && !shouldLazyLoad) {
      imgRef.current.src = optimizedSrc;
    }
  }, [optimizedSrc, shouldLazyLoad, lazyLoadImage]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder && (
            <img 
              src={placeholder} 
              alt="" 
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-800 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${shouldLazyLoad ? 'lazy' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={shouldLazyLoad ? 'lazy' : 'eager'}
        decoding="async"
      />
    </div>
  );
}