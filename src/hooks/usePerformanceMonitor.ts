import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  isLagging: boolean;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    isLagging: false
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const measureFPS = useCallback(() => {
    let frames = 0;
    let lastTime = performance.now();
    let lastFpsUpdate = lastTime;

    const tick = (currentTime: number) => {
      frames++;
      
      if (currentTime - lastFpsUpdate >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastFpsUpdate));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          isLagging: fps < 45 // Consider below 45fps as lagging
        }));
        
        frames = 0;
        lastFpsUpdate = currentTime;
      }
      
      if (isMonitoring) {
        requestAnimationFrame(tick);
      }
    };

    if (isMonitoring) {
      requestAnimationFrame(tick);
    }
  }, [isMonitoring]);

  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(usagePercent)
      }));
    }
  }, []);

  const measureRenderTime = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const renderEntries = entries.filter(entry => entry.entryType === 'measure');
      
      if (renderEntries.length > 0) {
        const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
        
        setMetrics(prev => ({
          ...prev,
          renderTime: Math.round(avgRenderTime * 100) / 100
        }));
      }
    });

    if ('PerformanceObserver' in window) {
      observer.observe({ entryTypes: ['measure'] });
      return () => observer.disconnect();
    }
    
    return () => {};
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      measureFPS();
      
      const memoryInterval = setInterval(measureMemory, 2000);
      const renderCleanup = measureRenderTime();
      
      return () => {
        clearInterval(memoryInterval);
        renderCleanup();
      };
    }
  }, [isMonitoring, measureFPS, measureMemory, measureRenderTime]);

  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    isMonitoring
  };
};
