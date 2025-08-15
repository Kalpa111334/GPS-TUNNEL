import React from 'react';
import { MapPin, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface LocationStatusProps {
  isConnected: boolean;
  accuracy: number;
  speed: number;
  error: string | null;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  isConnected,
  accuracy,
  speed,
  error
}) => {
  const getAccuracyColor = (acc: number) => {
    if (acc <= 5) return 'text-green-600';
    if (acc <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyText = (acc: number) => {
    if (acc <= 5) return 'Excellent';
    if (acc <= 15) return 'Good';
    return 'Poor';
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-red-800 font-medium text-sm">Location Error</p>
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            GPS {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <MapPin className="w-4 h-4 text-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Accuracy:</span>
          <div className={`font-medium ${getAccuracyColor(accuracy)}`}>
            {getAccuracyText(accuracy)} (±{Math.round(accuracy)}m)
          </div>
        </div>
        <div>
          <span className="text-gray-500">Speed:</span>
          <div className="font-medium text-blue-600">
            {Math.round(speed * 3.6)} km/h
          </div>
        </div>
      </div>
    </div>
  );
};