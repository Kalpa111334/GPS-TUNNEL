import { useState, useEffect, useRef } from 'react';
import { Position } from '../types';
import { GoogleMapsService } from '../services/googleMapsService';

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  position: Position;
}

interface NavigationState {
  isNavigating: boolean;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  remainingDistance: number;
  remainingTime: number;
  steps: NavigationStep[];
  routePath: Position[];
}

export const useNavigation = (currentPosition: Position | null) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentStep: null,
    nextStep: null,
    remainingDistance: 0,
    remainingTime: 0,
    steps: [],
    routePath: []
  });

  const [destination, setDestination] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const lastAnnouncedStep = useRef<number>(-1);

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

  const startNavigation = async (destinationPos: Position) => {
    if (!currentPosition) {
      setError('Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    setError(null);
    setDestination(destinationPos);

    try {
      const mapsService = GoogleMapsService.getInstance();
      const route = await mapsService.calculateDetailedRoute(currentPosition, destinationPos);
      
      setNavigationState({
        isNavigating: true,
        currentStep: route.steps[0] || null,
        nextStep: route.steps[1] || null,
        remainingDistance: route.totalDistance,
        remainingTime: route.totalDuration,
        steps: route.steps,
        routePath: route.path
      });

      lastAnnouncedStep.current = -1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
      console.error('Navigation error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const stopNavigation = () => {
    setNavigationState({
      isNavigating: false,
      currentStep: null,
      nextStep: null,
      remainingDistance: 0,
      remainingTime: 0,
      steps: [],
      routePath: []
    });
    setDestination(null);
    setError(null);
    lastAnnouncedStep.current = -1;
  };

  // Update navigation progress based on current position
  useEffect(() => {
    if (!navigationState.isNavigating || !currentPosition || navigationState.steps.length === 0) {
      return;
    }

    // Find the closest step to current position
    let closestStepIndex = 0;
    let minDistance = Infinity;

    navigationState.steps.forEach((step, index) => {
      const distance = calculateDistance(currentPosition, step.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestStepIndex = index;
      }
    });

    // Update current and next steps
    const currentStep = navigationState.steps[closestStepIndex];
    const nextStep = navigationState.steps[closestStepIndex + 1] || null;

    // Calculate remaining distance and time
    let remainingDistance = 0;
    let remainingTime = 0;

    for (let i = closestStepIndex; i < navigationState.steps.length; i++) {
      remainingDistance += navigationState.steps[i].distance;
      remainingTime += navigationState.steps[i].duration;
    }

    // Add distance from current position to current step
    if (currentStep) {
      const distanceToCurrentStep = calculateDistance(currentPosition, currentStep.position);
      remainingDistance += distanceToCurrentStep;
    }

    setNavigationState(prev => ({
      ...prev,
      currentStep,
      nextStep,
      remainingDistance,
      remainingTime
    }));

    // Check if we've reached the destination
    if (destination) {
      const distanceToDestination = calculateDistance(currentPosition, destination);
      if (distanceToDestination < 50) { // Within 50 meters
        // Arrived at destination
        setTimeout(() => {
          stopNavigation();
        }, 2000);
      }
    }

  }, [currentPosition, navigationState.isNavigating, navigationState.steps, destination]);

  const getCurrentInstruction = (): string | null => {
    return navigationState.currentStep?.instruction || null;
  };

  const getNextInstruction = (): string | null => {
    return navigationState.nextStep?.instruction || null;
  };

  const shouldAnnounceStep = (stepIndex: number): boolean => {
    return stepIndex !== lastAnnouncedStep.current && stepIndex >= 0;
  };

  const markStepAnnounced = (stepIndex: number) => {
    lastAnnouncedStep.current = stepIndex;
  };

  const getCurrentStepIndex = (): number => {
    if (!navigationState.currentStep) return -1;
    return navigationState.steps.findIndex(step => step === navigationState.currentStep);
  };

  return {
    navigationState,
    destination,
    error,
    isCalculatingRoute,
    startNavigation,
    stopNavigation,
    getCurrentInstruction,
    getNextInstruction,
    shouldAnnounceStep,
    markStepAnnounced,
    getCurrentStepIndex
  };
};