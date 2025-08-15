// Mobile performance optimization utilities

export interface PerformanceConfig {
  reducedAnimations: boolean;
  lowQualityImages: boolean;
  limitedFeatures: boolean;
  optimizedRendering: boolean;
}

export const getOptimalPerformanceConfig = (
  devicePixelRatio: number,
  connectionType: string,
  isLowPowerMode: boolean,
  screenWidth: number
): PerformanceConfig => {
  const isSlowConnection = ['slow-2g', '2g'].includes(connectionType);
  const isSmallScreen = screenWidth < 768;
  const isLowEndDevice = devicePixelRatio < 1.5;

  return {
    reducedAnimations: isLowPowerMode || isLowEndDevice || isSlowConnection,
    lowQualityImages: isSlowConnection || isLowEndDevice,
    limitedFeatures: isLowPowerMode || isSlowConnection,
    optimizedRendering: isSmallScreen || isLowEndDevice
  };
};

// Throttle function for performance-sensitive operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Debounce function for input handlers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Request idle callback wrapper with fallback
export const requestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    return window.setTimeout(callback, 1);
  }
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }
  return null;
};

// Memory usage optimization
export const clearMemoryCache = () => {
  // Clear any cached resources
  if ('memory' in performance) {
    // Chrome-specific memory info
    const memInfo = (performance as any).memory;
    if (memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.8) {
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    }
  }
};

// Reduce animation frame rate for low-end devices
export const adaptiveRequestAnimationFrame = (
  callback: FrameRequestCallback,
  targetFPS: number = 60
): number => {
  const interval = 1000 / targetFPS;
  let lastTime = 0;

  const animateFrame = (currentTime: number) => {
    if (currentTime - lastTime >= interval) {
      callback(currentTime);
      lastTime = currentTime;
    }
    return requestAnimationFrame(animateFrame);
  };

  return requestAnimationFrame(animateFrame);
};

// Preload critical resources
export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Battery API integration for power-aware features
export const getBatteryStatus = async (): Promise<{
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
} | null> => {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      console.warn('Battery API not available:', error);
      return null;
    }
  }
  return null;
};

// Network-aware loading
export const getNetworkInfo = (): {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} | null => {
  const connection = (navigator as any)?.connection;
  if (connection) {
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  return null;
};

// Touch optimization
export const optimizeTouchEvents = (element: HTMLElement) => {
  // Passive touch listeners for better scrolling performance
  element.addEventListener('touchstart', () => {}, { passive: true });
  element.addEventListener('touchmove', () => {}, { passive: true });
  element.addEventListener('touchend', () => {}, { passive: true });

  // Prevent context menu on long press for touch devices
  element.addEventListener('contextmenu', (e) => {
    if ('ontouchstart' in window) {
      e.preventDefault();
    }
  });
};
