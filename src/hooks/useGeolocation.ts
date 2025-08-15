import { useState, useEffect, useRef } from 'react';
import { Position } from '../types';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const [previousPosition, setPreviousPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const watchId = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const isInitialized = useRef<boolean>(false);

  // Initialize location services immediately
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      initializeLocation();
    }
  }, []);

  const initializeLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get initial position immediately
      await getCurrentPosition();
      setHasPermission(true);
      
      // Start continuous tracking
      startContinuousTracking();
    } catch (err) {
      handleLocationError(err);
    }
  };

  const handleLocationError = (err: any) => {
    let errorMessage = 'Unable to get your location';
    
    if (err.code) {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services and refresh the page.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location unavailable. Please check your GPS settings.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out. Retrying...';
          // Auto-retry on timeout
          setTimeout(() => initializeLocation(), 3000);
          return;
        default:
          errorMessage = err.message || 'Location error occurred';
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setHasPermission(false);
  };

  const reverseGeocode = async (pos: Position): Promise<void> => {
    try {
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = new window.google.maps.LatLng(pos.lat, pos.lng);
        
        geocoder.geocode({ location: latlng }, (results: any[], status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            setCurrentAddress(results[0].formatted_address);
          } else {
            setCurrentAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
          }
        });
      } else {
        setCurrentAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setCurrentAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
    }
  };

  const calculateSpeed = (current: Position, previous: Position, timeDiff: number): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = previous.lat * Math.PI / 180;
    const lat2Rad = current.lat * Math.PI / 180;
    const deltaLat = (current.lat - previous.lat) * Math.PI / 180;
    const deltaLng = (current.lng - previous.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance / (timeDiff / 1000); // meters per second
  };

  const calculateHeading = (current: Position, previous: Position): number => {
    const lat1Rad = previous.lat * Math.PI / 180;
    const lat2Rad = current.lat * Math.PI / 180;
    const deltaLng = (current.lng - previous.lng) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

    const bearing = Math.atan2(y, x);
    return (bearing * 180 / Math.PI + 360) % 360;
  };

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = pos1.lat * Math.PI / 180;
    const lat2Rad = pos2.lat * Math.PI / 180;
    const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const deltaLng = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  };

  const startContinuousTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    // Enhanced mobile GPS options for high accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // Increased timeout for mobile GPS
      maximumAge: 1000 // Reduced cache time for better accuracy
    };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const currentTime = Date.now();
        const newPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        // Filter out inaccurate readings on mobile
        const accuracy = pos.coords.accuracy;
        if (accuracy > 100) {
          console.warn(`Low GPS accuracy: ${accuracy}m, skipping update`);
          return;
        }

        // Prevent rapid position jumps (GPS drift filtering)
        if (position) {
          const distance = calculateDistance(newPosition, position);
          const timeDiff = currentTime - lastUpdateTime.current;
          const maxReasonableSpeed = 50; // 50 m/s max reasonable speed
          
          if (distance / (timeDiff / 1000) > maxReasonableSpeed) {
            console.warn('GPS jump detected, filtering out erratic reading');
            return;
          }
        }

        // Calculate speed and heading if we have a previous position
        if (previousPosition) {
          const timeDiff = currentTime - lastUpdateTime.current;
          if (timeDiff > 1000) { // Only calculate if enough time has passed
            const calculatedSpeed = calculateSpeed(newPosition, previousPosition, timeDiff);
            const calculatedHeading = calculateHeading(newPosition, previousPosition);
            
            // Smooth speed and heading changes
            setSpeed(speed => speed * 0.7 + calculatedSpeed * 0.3);
            setHeading(heading => {
              const diff = calculatedHeading - heading;
              const normalizedDiff = ((diff + 180) % 360) - 180;
              return heading + normalizedDiff * 0.3;
            });
          }
        }

        setPreviousPosition(position);
        setPosition(newPosition);
        setAccuracy(accuracy);
        lastUpdateTime.current = currentTime;
        
        // Throttled address updates to prevent flickering
        const timeSinceLastGeocode = currentTime - (lastUpdateTime.current || 0);
        if (timeSinceLastGeocode > 5000) {
          reverseGeocode(newPosition);
        }
        
        setError(null);
        setIsLoading(false);
      },
      handleLocationError,
      options
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setSpeed(0);
      setHeading(0);
    }
  };

  const getCurrentPosition = (): Promise<Position> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          
          setPosition(newPosition);
          setAccuracy(pos.coords.accuracy);
          setIsLoading(false);
          setError(null);
          
          // Update address
          reverseGeocode(newPosition);
          
          resolve(newPosition);
        },
        (err) => {
          handleLocationError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }
      );
    });
  };

  const startTracking = (options: GeolocationOptions = {}) => {
    if (!hasPermission) {
      initializeLocation();
    } else {
      startContinuousTracking();
    }
  };

  return {
    position,
    previousPosition,
    error,
    isLoading,
    speed,
    heading,
    accuracy,
    currentAddress,
    hasPermission,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
};