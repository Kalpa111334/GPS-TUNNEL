import React from 'react';
import { Navigation, ArrowRight, MapPin, Clock, Route } from 'lucide-react';
import { Position } from '../types';

interface NavigationViewProps {
  isNavigating: boolean;
  currentInstruction: string | null;
  nextInstruction: string | null;
  remainingDistance: number;
  remainingTime: number;
  destination: Position | null;
  onStopNavigation: () => void;
}

export const NavigationView: React.FC<NavigationViewProps> = ({
  isNavigating,
  currentInstruction,
  nextInstruction,
  remainingDistance,
  remainingTime,
  destination,
  onStopNavigation
}) => {
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-teal-800 text-white shadow-2xl safe-area-top animate-slide-down">
      <div className="mobile-container py-3 sm:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Navigation className="w-5 sm:w-6 h-5 sm:h-6 text-blue-300" />
            <h2 className="text-lg sm:text-xl font-bold">
              <span className="hidden sm:inline">3D Navigation Active</span>
              <span className="sm:hidden">Navigating</span>
            </h2>
          </div>
          <button
            onClick={onStopNavigation}
            className="btn-touch touch-feedback bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition-mobile text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Stop Navigation</span>
            <span className="sm:hidden">Stop</span>
          </button>
        </div>

        {/* Navigation Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Distance & Time */}
          <div className="mobile-card p-3 sm:p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Route className="w-4 sm:w-5 h-4 sm:h-5 text-blue-300" />
              <span className="font-semibold text-sm sm:text-base">Remaining</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{formatDistance(remainingDistance)}</div>
            <div className="text-blue-200 text-xs sm:text-sm">{formatTime(remainingTime)}</div>
          </div>

          {/* Current Instruction */}
          <div className="mobile-card p-3 sm:p-4 md:col-span-2">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
              <span className="font-semibold text-sm sm:text-base">Current Direction</span>
            </div>
            <div className="text-base sm:text-lg font-medium">
              {currentInstruction || 'Continue straight'}
            </div>
            {nextInstruction && (
              <div className="text-blue-200 text-xs sm:text-sm mt-2">
                Then: {nextInstruction}
              </div>
            )}
          </div>
        </div>

        {/* Destination Info */}
        {destination && (
          <div className="bg-white/5 rounded-lg p-3 touch-feedback">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-xs sm:text-sm font-medium">Destination:</span>
              <span className="text-xs sm:text-sm text-blue-200 font-mono break-all">
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};