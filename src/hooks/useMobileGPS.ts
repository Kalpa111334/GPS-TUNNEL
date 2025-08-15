import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../types';

interface MobileGPSOptions {
  highAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  enableFilter?: boolean;
  accuracyThreshold?: number;
}

interface GPSReading extends Position {
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export const useMobileGPS = (options: MobileGPSOptions = {}) => {
  const {
    highAccuracy = true,
    timeout = 15000, // Longer timeout for mobile GPS
    maximumAge = 1000,
    enableFilter = true,
    accuracyThreshold = 50
  } = options;

  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);

  const watchId = useRef<number | null>(null);
  const readings = useRef<GPSReading[]>([]);
  const lastValidPosition = useRef<GPSReading | null>(null);

  // Kalman filter for GPS smoothing
  const kalmanFilter = useRef({
    Q: 0.00001, // Process noise
    R: 0.01,    // Measurement noise
    P: 1,       // Estimation error
    X: { lat: 0, lng: 0 }, // State
    K: 0        // Kalman gain
  });

  const applyKalmanFilter = useCallback((newReading: GPSReading): Position => {
    const filter = kalmanFilter.current;
    
    if (!lastValidPosition.current) {
      filter.X = { lat: newReading.lat, lng: newReading.lng };
      return newReading;
    }

    // Prediction step
    filter.P = filter.P + filter.Q;

    // Update step
    filter.K = filter.P / (filter.P + filter.R);
    
    const smoothedLat = filter.X.lat + filter.K * (newReading.lat - filter.X.lat);
    const smoothedLng = filter.X.lng + filter.K * (newReading.lng - filter.X.lng);
    
    filter.X = { lat: smoothedLat, lng: smoothedLng };
    filter.P = (1 - filter.K) * filter.P;

    return { lat: smoothedLat, lng: smoothedLng };
  }, []);

  const calculateDistance = useCallback((pos1: Position, pos2: Position): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = pos1.lat * Math.PI / 180;
    const lat2Rad = pos2.lat * Math.PI / 180;
    const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const deltaLng = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }, []);

  const isValidReading = useCallback((reading: GPSReading): boolean => {
    // Check accuracy threshold
    if (reading.accuracy > accuracyThreshold) {
      return false;
    }

    // Check for GPS jumps (movement faster than 100 m/s is likely GPS error)
    if (lastValidPosition.current) {
      const distance = calculateDistance(reading, lastValidPosition.current);
      const timeDiff = (reading.timestamp - lastValidPosition.current.timestamp) / 1000;
      const speed = distance / timeDiff;
      
      if (speed > 100) { // 100 m/s = 360 km/h
        console.warn(`GPS jump detected: ${speed.toFixed(1)} m/s`);
        return false;
      }
    }

    return true;
  }, [accuracyThreshold, calculateDistance]);

  const processGPSReading = useCallback((pos: GeolocationPosition) => {
    const reading: GPSReading = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: Date.now(),
      speed: pos.coords.speed || undefined,
      heading: pos.coords.heading || undefined
    };

    // Add to readings history
    readings.current.push(reading);
    // Keep only last 10 readings
    if (readings.current.length > 10) {
      readings.current.shift();
    }

    // Validate reading
    if (!isValidReading(reading)) {
      console.warn('Invalid GPS reading filtered out', reading);
      return;
    }

    // Apply smoothing filter if enabled
    let smoothedPosition: Position;
    if (enableFilter && lastValidPosition.current) {
      smoothedPosition = applyKalmanFilter(reading);
    } else {
      smoothedPosition = { lat: reading.lat, lng: reading.lng };
    }

    // Calculate speed and heading if we have previous position
    if (lastValidPosition.current) {
      const timeDiff = reading.timestamp - lastValidPosition.current.timestamp;
      if (timeDiff > 1000) { // Only calculate if enough time passed
        const distance = calculateDistance(smoothedPosition, lastValidPosition.current);
        const calculatedSpeed = distance / (timeDiff / 1000);
        
        // Calculate heading
        const lat1Rad = lastValidPosition.current.lat * Math.PI / 180;
        const lat2Rad = smoothedPosition.lat * Math.PI / 180;
        const deltaLng = (smoothedPosition.lng - lastValidPosition.current.lng) * Math.PI / 180;

        const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

        const calculatedHeading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

        setSpeed(calculatedSpeed);
        setHeading(calculatedHeading);
      }
    }

    setPosition(smoothedPosition);
    setAccuracy(reading.accuracy);
    lastValidPosition.current = { ...reading, ...smoothedPosition };
    setError(null);
    setIsLoading(false);
  }, [enableFilter, isValidReading, applyKalmanFilter, calculateDistance]);

  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'GPS error occurred';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable GPS and location permissions.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'GPS signal unavailable. Please check your location settings.';
        break;
      case err.TIMEOUT:
        errorMessage = 'GPS timeout. Retrying...';
        // Auto-retry on timeout
        setTimeout(() => startTracking(), 3000);
        return;
    }
    
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      return;
    }

    setIsLoading(true);
    setError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: timeout,
      maximumAge: maximumAge
    };

    // Clear existing watch
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      processGPSReading,
      handleLocationError,
      geoOptions
    );
  }, [highAccuracy, timeout, maximumAge, processGPSReading, handleLocationError]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsLoading(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<Position> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported'));
        return;
      }

      const geoOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: timeout * 2, // Longer timeout for initial position
        maximumAge: 0 // Force fresh reading
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(position);
        },
        (err) => {
          handleLocationError(err);
          reject(err);
        },
        geoOptions
      );
    });
  }, [timeout, handleLocationError]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    position,
    error,
    isLoading,
    accuracy,
    speed,
    heading,
    startTracking,
    stopTracking,
    getCurrentPosition,
    // Additional mobile-specific data
    signalQuality: accuracy < 20 ? 'excellent' : accuracy < 50 ? 'good' : 'poor',
    isHighAccuracy: accuracy < 20
  };
};
