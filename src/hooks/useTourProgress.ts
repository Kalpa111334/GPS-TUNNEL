import { useState, useEffect } from 'react';
import { Position, TourPoint } from '../types';

export const useTourProgress = (
  position: Position | null,
  tourPoints: TourPoint[],
  isTourActive: boolean
) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedPoints, setCompletedPoints] = useState<string[]>([]);
  const [visitedPoints, setVisitedPoints] = useState<Set<string>>(new Set());

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

    return R * c;
  };

  const findNearestPoint = (currentPos: Position): number => {
    let nearestIndex = 0;
    let minDistance = Infinity;

    tourPoints.forEach((point, index) => {
      const distance = calculateDistance(currentPos, point.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  useEffect(() => {
    if (!isTourActive || !position || tourPoints.length === 0) {
      return;
    }

    const nearestIndex = findNearestPoint(position);
    const nearestPoint = tourPoints[nearestIndex];
    const distance = calculateDistance(position, nearestPoint.position);

    // If within 100 meters of a point, mark it as visited
    if (distance <= 100 && !visitedPoints.has(nearestPoint.id)) {
      setVisitedPoints(prev => new Set([...prev, nearestPoint.id]));
      
      // Add to completed points if not already there
      if (!completedPoints.includes(nearestPoint.id)) {
        setCompletedPoints(prev => [...prev, nearestPoint.id]);
      }
    }

    // Update current index to the next unvisited point
    const nextUnvisitedIndex = tourPoints.findIndex(
      (point, index) => index > nearestIndex && !visitedPoints.has(point.id)
    );
    
    if (nextUnvisitedIndex !== -1) {
      setCurrentIndex(nextUnvisitedIndex);
    } else {
      // If all points after current are visited, stay at current or move to next logical point
      setCurrentIndex(Math.min(nearestIndex + 1, tourPoints.length - 1));
    }

  }, [position, isTourActive, tourPoints, visitedPoints, completedPoints]);

  const resetProgress = () => {
    setCurrentIndex(0);
    setCompletedPoints([]);
    setVisitedPoints(new Set());
  };

  const getCurrentPoint = (): TourPoint | null => {
    return tourPoints[currentIndex] || null;
  };

  const getNextPoint = (): TourPoint | null => {
    return tourPoints[currentIndex + 1] || null;
  };

  const getProgressPercentage = (): number => {
    return tourPoints.length > 0 ? (completedPoints.length / tourPoints.length) * 100 : 0;
  };

  const isNearPoint = (pointId: string, threshold: number = 50): boolean => {
    if (!position) return false;
    
    const point = tourPoints.find(p => p.id === pointId);
    if (!point) return false;
    
    const distance = calculateDistance(position, point.position);
    return distance <= threshold;
  };

  return {
    currentIndex,
    completedPoints,
    visitedPoints: Array.from(visitedPoints),
    resetProgress,
    getCurrentPoint,
    getNextPoint,
    getProgressPercentage,
    isNearPoint
  };
};