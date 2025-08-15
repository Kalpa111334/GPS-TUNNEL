import React from 'react';
import { MapPin, Compass, Clock } from 'lucide-react';
import { TourPoint } from '../types';

interface TourInfoProps {
  currentPoint: TourPoint | null;
  nextPoint: TourPoint | null;
  distance: number;
  speed: number;
  selectedLanguage: string;
}

export const TourInfo: React.FC<TourInfoProps> = ({
  currentPoint,
  nextPoint,
  distance,
  speed,
  selectedLanguage
}) => {
  const formatDistance = (dist: number) => {
    if (dist < 1000) return `${Math.round(dist)}m`;
    return `${(dist / 1000).toFixed(1)}km`;
  };

  const formatSpeed = (spd: number) => {
    return `${Math.round(spd * 3.6)} km/h`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-blue-600" />
        Tour Status
      </h3>

      {nextPoint && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Next Destination</h4>
          <p className="text-lg font-medium text-blue-600">
            {nextPoint.title[selectedLanguage]}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {nextPoint.description[selectedLanguage]}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <Compass className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-600">
            {formatDistance(distance)}
          </div>
          <div className="text-xs text-gray-600">Distance</div>
        </div>

        <div className="bg-teal-50 rounded-lg p-3">
          <Clock className="w-6 h-6 text-teal-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-teal-600">
            {formatSpeed(speed)}
          </div>
          <div className="text-xs text-gray-600">Speed</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <MapPin className="w-6 h-6 text-orange-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-orange-600">
            {Math.round(distance / (speed || 1))}min
          </div>
          <div className="text-xs text-gray-600">ETA</div>
        </div>
      </div>
    </div>
  );
};