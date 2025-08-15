import { useState, useEffect } from 'react';
import { Position, TourPoint } from '../types';
import { GoogleMapsService } from '../services/googleMapsService';
import { TOUR_POINTS } from '../data/tourPoints';

export const useTourRoute = (startPosition: Position | null) => {
  const [tourPoints, setTourPoints] = useState<TourPoint[]>([]);
  const [routePath, setRoutePath] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTourRoute = async (currentPosition: Position) => {
    setIsLoading(true);
    setError(null);

    try {
      const mapsService = GoogleMapsService.getInstance();
      


      // Find nearby scenic points and restaurants
      const [scenicPoints, restaurants] = await Promise.all([
        mapsService.findScenicPoints(currentPosition),
        mapsService.findNearbyRestaurants(currentPosition)
      ]);



      // Combine all points
      const allPoints = [...scenicPoints, ...restaurants];
      setTourPoints(allPoints);

      // Calculate optimal route
      const waypoints = [...scenicPoints, ...restaurants].map(point => point.position);
      const optimizedRoute = await mapsService.calculateOptimalRoute(currentPosition, waypoints);
      setRoutePath(optimizedRoute);

    } catch (err) {
      console.warn('Places API failed, using predefined tour points:', err);
      
      // Use predefined tour points as fallback
      setTourPoints(TOUR_POINTS);
      
      // Calculate route using predefined waypoints
      try {
        const waypoints = TOUR_POINTS.filter(point => 
          point.type !== 'start' && point.type !== 'end'
        ).map(point => point.position);
        
        const mapsService = GoogleMapsService.getInstance();
        const optimizedRoute = await mapsService.calculateOptimalRoute(currentPosition, waypoints);
        setRoutePath(optimizedRoute);
        setError(null); // Clear error since fallback worked
      } catch (routeErr) {
        // If route calculation also fails, use simple path between points
        const simplePath = TOUR_POINTS.map(point => point.position);
        setRoutePath(simplePath);
        setError(null); // Don't show error for offline mode
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startPosition && window.google) {
      generateTourRoute(startPosition);
    }
  }, [startPosition]);

  return {
    tourPoints,
    routePath,
    isLoading,
    error,
    regenerateRoute: startPosition ? () => generateTourRoute(startPosition) : undefined
  };
};