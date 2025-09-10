import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  isSlowConnection: boolean;
}

export function useMobilePerformance() {
  const metricsRef = useRef<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    isSlowConnection: false
  });

  const startTimeRef = useRef<number>(0);

  // Detect slow connection
  const detectSlowConnection = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const slowConnections = ['slow-2g', '2g', '3g'];
      return slowConnections.includes(connection.effectiveType);
    }
    return false;
  }, []);

  // Measure performance metrics
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const loadTime = now - startTimeRef.current;
    
    // Memory usage (if available)
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    metricsRef.current = {
      loadTime,
      renderTime: now,
      memoryUsage,
      isSlowConnection: detectSlowConnection()
    };

    return metricsRef.current;
  }, [detectSlowConnection]);

  // Optimize images for mobile
  const optimizeImage = useCallback((src: string, width?: number, quality: number = 80) => {
    if (!src) return src;
    
    // If it's already optimized or external, return as is
    if (src.includes('?') || src.startsWith('http')) return src;
    
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    params.set('q', quality.toString());
    params.set('f', 'auto'); // Auto format
    
    return `${src}?${params.toString()}`;
  }, []);

  // Lazy load images
  const lazyLoadImage = useCallback((img: HTMLImageElement, src: string) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Throttle function for performance
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }, []);

  // Preload critical resources
  const preloadResource = useCallback((href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }, []);

  // Initialize performance tracking
  useEffect(() => {
    startTimeRef.current = performance.now();
    
    // Measure performance after initial render
    const timer = setTimeout(measurePerformance, 100);
    
    return () => clearTimeout(timer);
  }, [measurePerformance]);

  // Monitor memory usage
  useEffect(() => {
    if (!('memory' in performance)) return;

    const monitorMemory = () => {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024;
      
      // Log warning if memory usage is high
      if (used > 50) {
        console.warn(`High memory usage detected: ${used.toFixed(2)}MB`);
      }
    };

    const interval = setInterval(monitorMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Optimize scroll performance
  useEffect(() => {
    let ticking = false;

    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Scroll optimization logic here
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizeScroll, { passive: true });
    return () => window.removeEventListener('scroll', optimizeScroll);
  }, []);

  return {
    metrics: metricsRef.current,
    measurePerformance,
    optimizeImage,
    lazyLoadImage,
    debounce,
    throttle,
    preloadResource,
    isSlowConnection: metricsRef.current.isSlowConnection
  };
}