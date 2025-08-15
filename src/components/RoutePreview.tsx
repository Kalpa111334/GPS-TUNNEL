import React from 'react';
import { MapPin, Clock, Route, Star } from 'lucide-react';
import { TourPoint } from '../types';

interface RoutePreviewProps {
  tourPoints: TourPoint[];
  selectedLanguage: string;
  estimatedDuration: number;
  totalDistance: number;
  onStartTour: () => void;
}

export const RoutePreview: React.FC<RoutePreviewProps> = ({
  tourPoints,
  selectedLanguage,
  estimatedDuration,
  totalDistance,
  onStartTour
}) => {
  const formatDistance = (distance: number) => {
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Route className="w-5 h-5 mr-2" />
          Tour Preview
        </h3>
        <div className="flex items-center space-x-4 text-white/80 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(estimatedDuration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{formatDistance(totalDistance)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {tourPoints.map((point, index) => (
          <div key={point.id} className="flex items-start space-x-3 bg-white/5 rounded-lg p-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                point.type === 'start' ? 'bg-green-500' :
                point.type === 'restaurant' ? 'bg-orange-500' :
                point.type === 'scenic' ? 'bg-blue-500' :
                point.type === 'end' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                {index + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">
                {point.title[selectedLanguage]}
              </h4>
              <p className="text-white/70 text-xs mt-1 line-clamp-2">
                {point.description[selectedLanguage]}
              </p>
              {point.type === 'restaurant' && (
                <div className="flex items-center mt-1">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-xs">Dining Location</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onStartTour}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
      >
        Start Guided Tour
      </button>
    </div>
  );
};