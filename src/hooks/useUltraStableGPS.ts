import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../types';

interface GPSBuffer extends Position {
  accuracy: number;
  timestamp: number;
  confidence: number;
  isValidated: boolean;
}

interface UltraStableGPSOptions {
  lockRadius?: number;           // Lock position within X meters
  minimumAccuracy?: number;      // Reject readings worse than X meters
  bufferSize?: number;          // Number of readings to keep in buffer
  lockThreshold?: number;       // Number of consistent readings to lock position
  maxJumpDistance?: number;     // Maximum allowed position jump in meters
  updateInterval?: number;      // Minimum time between position updates
  enablePositionLock?: boolean; // Enable position locking feature
  lockDuration?: number;        // How long to lock position (ms)
}

export const useUltraStableGPS = (options: UltraStableGPSOptions = {}) => {
  const {
    lockRadius = 2,
    minimumAccuracy = 5,
    bufferSize = 15,
    lockThreshold = 5,
    maxJumpDistance = 15,
    updateInterval = 1000,
    enablePositionLock = true,
    lockDuration = 5000
  } = options;

  const [position, setPosition] = useState<Position | null>(null);
  const [lockedPosition, setLockedPosition] = useState<Position | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signalQuality, setSignalQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');

  const watchId = useRef<number | null>(null);
  const gpsBuffer = useRef<GPSBuffer[]>([]);
  const lockTimer = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const consecutiveGoodReadings = useRef<number>(0);
  const basePosition = useRef<Position | null>(null);

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

  // Calculate weighted average of GPS buffer
  const calculateWeightedAverage = useCallback((): Position | null => {
    if (gpsBuffer.current.length === 0) return null;

    // Filter for recent, accurate readings
    const now = Date.now();
    const recentReadings = gpsBuffer.current.filter(reading => 
      now - reading.timestamp < 10000 && // Last 10 seconds
      reading.accuracy <= minimumAccuracy * 2 && // Reasonable accuracy
      reading.isValidated // Only validated readings
    );

    if (recentReadings.length === 0) return null;

    // Weight readings by accuracy and recency
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    recentReadings.forEach(reading => {
      // Higher weight for better accuracy and more recent readings
      const accuracyWeight = 1 / Math.max(reading.accuracy, 1);
      const timeWeight = 1 - ((now - reading.timestamp) / 10000); // Decay over 10 seconds
      const confidenceWeight = reading.confidence;
      
      const weight = accuracyWeight * timeWeight * confidenceWeight;
      
      weightedLat += reading.lat * weight;
      weightedLng += reading.lng * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0) return null;

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight
    };
  }, [minimumAccuracy]);

  // Validate GPS reading against existing data
  const validateGPSReading = useCallback((reading: GPSBuffer): boolean => {
    // Check minimum accuracy requirement
    if (reading.accuracy > minimumAccuracy) {
      console.warn(`GPS accuracy too poor: ${reading.accuracy}m > ${minimumAccuracy}m`);
      return false;
    }

    // Check for GPS jumps
    if (basePosition.current) {
      const distance = calculateDistance(reading, basePosition.current);
      if (distance > maxJumpDistance) {
        console.warn(`GPS jump detected: ${distance.toFixed(1)}m > ${maxJumpDistance}m`);
        return false;
      }
    }

    // Check consistency with recent readings
    if (gpsBuffer.current.length >= 3) {
      const recentReadings = gpsBuffer.current.slice(-3);
      const avgLat = recentReadings.reduce((sum, r) => sum + r.lat, 0) / recentReadings.length;
      const avgLng = recentReadings.reduce((sum, r) => sum + r.lng, 0) / recentReadings.length;
      
      const consistencyDistance = calculateDistance(reading, { lat: avgLat, lng: avgLng });
      if (consistencyDistance > lockRadius * 3) {
        console.warn(`GPS reading inconsistent: ${consistencyDistance.toFixed(1)}m`);
        return false;
      }
    }

    return true;
  }, [minimumAccuracy, maxJumpDistance, lockRadius, calculateDistance]);

  // Lock position when stable
  const lockPosition = useCallback((pos: Position) => {
    setLockedPosition(pos);
    setIsLocked(true);
    basePosition.current = pos;
    console.log(`GPS position locked at: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);

    // Auto-unlock after duration
    if (lockTimer.current) {
      clearTimeout(lockTimer.current);
    }
    
    lockTimer.current = setTimeout(() => {
      setIsLocked(false);
      console.log('GPS position unlocked');
    }, lockDuration);
  }, [lockDuration]);

  // Process GPS reading with ultra-stable filtering
  const processGPSReading = useCallback((geoPosition: GeolocationPosition) => {
    const now = Date.now();
    
    // Throttle updates
    if (now - lastUpdateTime.current < updateInterval) {
      return;
    }

    const reading: GPSBuffer = {
      lat: geoPosition.coords.latitude,
      lng: geoPosition.coords.longitude,
      accuracy: geoPosition.coords.accuracy,
      timestamp: now,
      confidence: 0,
      isValidated: false
    };

    // Calculate confidence score
    reading.confidence = Math.max(0.1, Math.min(1.0, 
      1 - (reading.accuracy - minimumAccuracy) / (50 - minimumAccuracy)
    ));

    // Validate reading
    reading.isValidated = validateGPSReading(reading);

    if (!reading.isValidated) {
      return; // Skip invalid readings
    }

    // Add to buffer
    gpsBuffer.current.push(reading);
    if (gpsBuffer.current.length > bufferSize) {
      gpsBuffer.current.shift();
    }

    // Count consecutive good readings
    if (reading.accuracy <= minimumAccuracy) {
      consecutiveGoodReadings.current++;
    } else {
      consecutiveGoodReadings.current = 0;
    }

    // Calculate stable position
    const stablePosition = calculateWeightedAverage();
    if (!stablePosition) return;

    // Check if we should lock position
    if (enablePositionLock && !isLocked && consecutiveGoodReadings.current >= lockThreshold) {
      // Verify all recent readings are within lock radius
      const recentReadings = gpsBuffer.current.slice(-lockThreshold);
      const withinRadius = recentReadings.every(r => {
        const distance = calculateDistance(stablePosition, r);
        return distance <= lockRadius;
      });

      if (withinRadius) {
        lockPosition(stablePosition);
      }
    }

    // Use locked position if available and recent readings are within radius
    let finalPosition = stablePosition;
    
    if (isLocked && lockedPosition && enablePositionLock) {
      const distanceFromLock = calculateDistance(stablePosition, lockedPosition);
      
      if (distanceFromLock <= lockRadius) {
        // Stay locked - use locked position
        finalPosition = lockedPosition;
      } else {
        // Movement detected - unlock and use new position
        setIsLocked(false);
        setLockedPosition(null);
        basePosition.current = stablePosition;
        finalPosition = stablePosition;
        console.log('GPS unlocked due to movement');
      }
    } else {
      basePosition.current = stablePosition;
    }

    // Update state
    setPosition(finalPosition);
    setAccuracy(reading.accuracy);
    setConfidence(reading.confidence);
    
    // Update signal quality
    if (reading.accuracy <= 5) setSignalQuality('excellent');
    else if (reading.accuracy <= 10) setSignalQuality('good');
    else if (reading.accuracy <= 20) setSignalQuality('fair');
    else setSignalQuality('poor');

    lastUpdateTime.current = now;
    setError(null);
    setIsLoading(false);

  }, [
    updateInterval, minimumAccuracy, validateGPSReading, bufferSize, 
    calculateWeightedAverage, enablePositionLock, isLocked, lockThreshold, 
    lockRadius, calculateDistance, lockedPosition, lockPosition
  ]);

  // Handle GPS errors
  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'GPS error occurred';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'GPS permission denied. Please enable location access in settings.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'GPS signal unavailable. Move to an area with better signal.';
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

  // Start ultra-stable GPS tracking
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

    // Ultra-conservative GPS options for stability
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,    // Long timeout for better readings
      maximumAge: 0      // Always get fresh readings
    };

    watchId.current = navigator.geolocation.watchPosition(
      processGPSReading,
      handleError,
      options
    );

    console.log('Ultra-stable GPS tracking started');
  }, [processGPSReading, handleError]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (lockTimer.current) {
      clearTimeout(lockTimer.current);
      lockTimer.current = null;
    }
    
    setIsLoading(false);
    setIsLocked(false);
    console.log('Ultra-stable GPS tracking stopped');
  }, []);

  // Manual position lock/unlock
  const toggleLock = useCallback(() => {
    if (isLocked) {
      setIsLocked(false);
      setLockedPosition(null);
    } else if (position) {
      lockPosition(position);
    }
  }, [isLocked, position, lockPosition]);

  // Force position reset
  const resetPosition = useCallback(() => {
    gpsBuffer.current = [];
    consecutiveGoodReadings.current = 0;
    setIsLocked(false);
    setLockedPosition(null);
    basePosition.current = null;
    console.log('GPS position reset');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // Current position (locked or calculated)
    position,
    lockedPosition,
    isLocked,
    
    // GPS quality metrics
    accuracy,
    confidence,
    signalQuality,
    error,
    isLoading,
    
    // Control functions
    startTracking,
    stopTracking,
    toggleLock,
    resetPosition,
    
    // Status information
    bufferSize: gpsBuffer.current.length,
    consecutiveGoodReadings: consecutiveGoodReadings.current,
    isStable: isLocked || (consecutiveGoodReadings.current >= lockThreshold),
    
    // Advanced features
    enablePositionLock,
    lockRadius,
    minimumAccuracy
  };
};
