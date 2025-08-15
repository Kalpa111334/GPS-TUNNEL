import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  isLowPowerMode: boolean;
  connectionType: string;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenSize: { width: 1024, height: 768 },
        devicePixelRatio: 1,
        isLowPowerMode: false,
        connectionType: 'unknown'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    // Detect low power mode (rough estimation)
    const isLowPowerMode = (
      // Old devices with low pixel ratio
      window.devicePixelRatio < 1.5 ||
      // Very small screens
      (width * height) < 400000 ||
      // Slow connection
      (navigator as any)?.connection?.effectiveType === 'slow-2g' ||
      (navigator as any)?.connection?.effectiveType === '2g'
    );

    // Get connection type
    const connection = (navigator as any)?.connection;
    const connectionType = connection?.effectiveType || 'unknown';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenSize: { width, height },
      devicePixelRatio: window.devicePixelRatio || 1,
      isLowPowerMode,
      connectionType
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      const isLowPowerMode = (
        window.devicePixelRatio < 1.5 ||
        (width * height) < 400000 ||
        (navigator as any)?.connection?.effectiveType === 'slow-2g' ||
        (navigator as any)?.connection?.effectiveType === '2g'
      );

      const connection = (navigator as any)?.connection;
      const connectionType = connection?.effectiveType || 'unknown';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize: { width, height },
        devicePixelRatio: window.devicePixelRatio || 1,
        isLowPowerMode,
        connectionType
      });
    };

    const handleResize = () => {
      requestAnimationFrame(updateDeviceInfo);
    };

    const handleConnectionChange = () => {
      updateDeviceInfo();
    };

    window.addEventListener('resize', handleResize);
    (navigator as any)?.connection?.addEventListener('change', handleConnectionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      (navigator as any)?.connection?.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return deviceInfo;
};
