import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../types';

interface GPSReading extends Position {
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
  confidence: number;
}

interface StableGPSOptions {
  minAccuracy?: number;
  maxAccuracy?: number;
  smoothingFactor?: number;
  outlierThreshold?: number;
  minUpdateInterval?: number;
  enableKalmanFilter?: boolean;
  enableMedianFilter?: boolean;
  enableConfidenceFiltering?: boolean;
}

export const useStableGPS = (options: StableGPSOptions = {}) => {
  const {
    minAccuracy = 5,      // Minimum required accuracy in meters
    maxAccuracy = 50,     // Maximum acceptable accuracy in meters
    smoothingFactor = 0.3, // Lower = more smoothing (0.1-0.5)
    outlierThreshold = 30, // Maximum jump distance in meters
    minUpdateInterval = 500, // Minimum time between updates in ms
    enableKalmanFilter = true,
    enableMedianFilter = true,
    enableConfidenceFiltering = true
  } = options;

  const [position, setPosition] = useState<Position | null>(null);
  const [smoothedPosition, setSmoothedPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [signalQuality, setSignalQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');

  const watchId = useRef<number | null>(null);
  const readings = useRef<GPSReading[]>([]);
  const lastValidReading = useRef<GPSReading | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const stabilizedPosition = useRef<Position | null>(null);

  // Enhanced Kalman Filter for GPS coordinates
  const kalmanState = useRef({
    // State vectors [lat, lng, vel_lat, vel_lng]
    x: [0, 0, 0, 0],
    // Error covariance matrix (simplified)
    P: [
      [1000, 0, 0, 0],
      [0, 1000, 0, 0],
      [0, 0, 1000, 0],
      [0, 0, 0, 1000]
    ],
    // Process noise
    Q: 0.1,
    // Measurement noise (varies with GPS accuracy)
    R: 1,
    initialized: false
  });

  // Calculate distance between two GPS coordinates
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

  // Advanced Kalman Filter implementation
  const applyKalmanFilter = useCallback((reading: GPSReading): Position => {
    const state = kalmanState.current;
    const dt = lastValidReading.current 
      ? (reading.timestamp - lastValidReading.current.timestamp) / 1000 
      : 1;

    if (!state.initialized) {
      // Initialize state
      state.x = [reading.lat, reading.lng, 0, 0];
      state.initialized = true;
      return { lat: reading.lat, lng: reading.lng };
    }

    // Prediction step
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    // Predict state
    const x_pred = [
      state.x[0] + state.x[2] * dt,
      state.x[1] + state.x[3] * dt,
      state.x[2],
      state.x[3]
    ];

    // Adapt measurement noise based on GPS accuracy
    state.R = Math.max(0.1, reading.accuracy / 10);

    // Update step
    const y = [reading.lat - x_pred[0], reading.lng - x_pred[1]];
    const S = state.P[0][0] + state.R;
    const K = [
      [state.P[0][0] / S, state.P[0][1] / S],
      [state.P[1][0] / S, state.P[1][1] / S],
      [state.P[2][0] / S, state.P[2][1] / S],
      [state.P[3][0] / S, state.P[3][1] / S]
    ];

    // Update state
    state.x[0] = x_pred[0] + K[0][0] * y[0] + K[0][1] * y[1];
    state.x[1] = x_pred[1] + K[1][0] * y[0] + K[1][1] * y[1];
    state.x[2] = x_pred[2] + K[2][0] * y[0] + K[2][1] * y[1];
    state.x[3] = x_pred[3] + K[3][0] * y[0] + K[3][1] * y[1];

    return { lat: state.x[0], lng: state.x[1] };
  }, []);

  // Median filter for outlier removal
  const applyMedianFilter = useCallback((reading: GPSReading): Position => {
    const recentReadings = readings.current.slice(-5); // Use last 5 readings
    
    if (recentReadings.length < 3) {
      return { lat: reading.lat, lng: reading.lng };
    }

    const lats = recentReadings.map(r => r.lat).sort((a, b) => a - b);
    const lngs = recentReadings.map(r => r.lng).sort((a, b) => a - b);
    
    const medianLat = lats[Math.floor(lats.length / 2)];
    const medianLng = lngs[Math.floor(lngs.length / 2)];

    return { lat: medianLat, lng: medianLng };
  }, []);

  // Calculate confidence score based on GPS characteristics
  const calculateConfidence = useCallback((reading: GPSReading): number => {
    let confidence = 1.0;

    // Factor 1: Accuracy (higher accuracy = higher confidence)
    if (reading.accuracy > 0) {
      confidence *= Math.max(0.1, 1 - (reading.accuracy - minAccuracy) / (maxAccuracy - minAccuracy));
    }

    // Factor 2: Consistency with recent readings
    if (readings.current.length > 2) {
      const recent = readings.current.slice(-3);
      const avgLat = recent.reduce((sum, r) => sum + r.lat, 0) / recent.length;
      const avgLng = recent.reduce((sum, r) => sum + r.lng, 0) / recent.length;
      const deviation = calculateDistance(reading, { lat: avgLat, lng: avgLng });
      
      confidence *= Math.max(0.1, 1 - deviation / 20); // 20m max acceptable deviation
    }

    // Factor 3: Time stability (readings too frequent might be unreliable)
    if (lastValidReading.current) {
      const timeDiff = reading.timestamp - lastValidReading.current.timestamp;
      if (timeDiff < 1000) {
        confidence *= 0.7; // Reduce confidence for very frequent updates
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }, [minAccuracy, maxAccuracy, calculateDistance]);

  // Validate GPS reading
  const isValidReading = useCallback((reading: GPSReading): boolean => {
    // Check accuracy bounds
    if (reading.accuracy < minAccuracy || reading.accuracy > maxAccuracy) {
      console.warn(`GPS accuracy out of bounds: ${reading.accuracy}m`);
      return false;
    }

    // Check for outliers
    if (lastValidReading.current) {
      const distance = calculateDistance(reading, lastValidReading.current);
      const timeDiff = (reading.timestamp - lastValidReading.current.timestamp) / 1000;
      
      // Check for impossible movement (faster than 200 km/h)
      if (timeDiff > 0 && distance / timeDiff > 55) { // 55 m/s = 200 km/h
        console.warn(`GPS outlier detected: ${(distance/timeDiff*3.6).toFixed(1)} km/h`);
        return false;
      }

      // Check for minimum distance change
      if (distance > outlierThreshold) {
        console.warn(`GPS jump too large: ${distance.toFixed(1)}m`);
        return false;
      }
    }

    return true;
  }, [minAccuracy, maxAccuracy, outlierThreshold, calculateDistance]);

  // Process new GPS reading with all filters
  const processGPSReading = useCallback((pos: GeolocationPosition) => {
    const now = Date.now();
    
    // Throttle updates
    if (now - lastUpdateTime.current < minUpdateInterval) {
      return;
    }

    const reading: GPSReading = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: now,
      speed: pos.coords.speed || undefined,
      heading: pos.coords.heading || undefined,
      confidence: 0
    };

    // Calculate confidence score
    reading.confidence = enableConfidenceFiltering ? calculateConfidence(reading) : 1.0;

    // Skip low confidence readings
    if (enableConfidenceFiltering && reading.confidence < 0.3) {
      console.warn(`Low confidence GPS reading: ${reading.confidence.toFixed(2)}`);
      return;
    }

    // Validate reading
    if (!isValidReading(reading)) {
      return;
    }

    // Add to readings history
    readings.current.push(reading);
    if (readings.current.length > 20) {
      readings.current.shift();
    }

    // Apply filters
    let filteredPosition: Position = { lat: reading.lat, lng: reading.lng };

    if (enableMedianFilter && readings.current.length >= 3) {
      filteredPosition = applyMedianFilter(reading);
    }

    if (enableKalmanFilter) {
      filteredPosition = applyKalmanFilter({
        ...reading,
        lat: filteredPosition.lat,
        lng: filteredPosition.lng
      });
    }

    // Apply exponential smoothing if we have a previous position
    if (stabilizedPosition.current) {
      const smoothed = {
        lat: stabilizedPosition.current.lat * (1 - smoothingFactor) + 
             filteredPosition.lat * smoothingFactor,
        lng: stabilizedPosition.current.lng * (1 - smoothingFactor) + 
             filteredPosition.lng * smoothingFactor
      };
      stabilizedPosition.current = smoothed;
      setSmoothedPosition(smoothed);
    } else {
      stabilizedPosition.current = filteredPosition;
      setSmoothedPosition(filteredPosition);
    }

    // Update state
    setPosition({ lat: reading.lat, lng: reading.lng });
    setAccuracy(reading.accuracy);
    setConfidence(reading.confidence);
    
    // Update signal quality
    if (reading.accuracy <= 10) setSignalQuality('excellent');
    else if (reading.accuracy <= 20) setSignalQuality('good');
    else if (reading.accuracy <= 35) setSignalQuality('fair');
    else setSignalQuality('poor');

    lastValidReading.current = reading;
    lastUpdateTime.current = now;
    setError(null);
    setIsLoading(false);
  }, [
    minUpdateInterval, enableConfidenceFiltering, calculateConfidence, 
    isValidReading, enableMedianFilter, applyMedianFilter, 
    enableKalmanFilter, applyKalmanFilter, smoothingFactor
  ]);

  // Handle GPS errors
  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'GPS error occurred';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'GPS permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'GPS signal unavailable. Move to an open area.';
        break;
      case err.TIMEOUT:
        errorMessage = 'GPS timeout. Retrying...';
        setTimeout(() => startTracking(), 2000);
        return;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setSignalQuality('poor');
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clear existing watch
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    // Enhanced GPS options for mobile stability
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Longer timeout for better readings
      maximumAge: 2000 // Allow slightly cached readings for stability
    };

    watchId.current = navigator.geolocation.watchPosition(
      processGPSReading,
      handleError,
      options
    );
  }, [processGPSReading, handleError]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsLoading(false);
  }, []);

  // Get current position immediately
  const getCurrentPosition = useCallback((): Promise<Position> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(position);
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    // Raw GPS position
    position,
    // Filtered and smoothed position (recommended for map display)
    smoothedPosition,
    // GPS metadata
    accuracy,
    confidence,
    signalQuality,
    error,
    isLoading,
    // Control functions
    startTracking,
    stopTracking,
    getCurrentPosition,
    // Debug information
    rawReadingsCount: readings.current.length,
    lastAccuracy: lastValidReading.current?.accuracy || 0,
    isStable: confidence > 0.7 && signalQuality !== 'poor'
  };
};
