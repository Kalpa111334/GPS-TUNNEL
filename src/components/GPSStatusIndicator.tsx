import React from 'react';
import { Satellite, Navigation, Signal, AlertTriangle, CheckCircle } from 'lucide-react';

interface GPSStatusIndicatorProps {
  accuracy: number;
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
  isStable: boolean;
  isLoading: boolean;
  error: string | null;
  readingsCount?: number;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({
  accuracy,
  signalQuality,
  confidence,
  isStable,
  isLoading,
  error,
  readingsCount = 0
}) => {
  const getSignalIcon = () => {
    if (error) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isLoading) return <Satellite className="w-4 h-4 text-yellow-500 animate-pulse" />;
    if (isStable) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Navigation className="w-4 h-4 text-blue-500" />;
  };

  const getSignalBars = () => {
    let bars = 0;
    switch (signalQuality) {
      case 'excellent': bars = 4; break;
      case 'good': bars = 3; break;
      case 'fair': bars = 2; break;
      case 'poor': bars = 1; break;
    }

    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm ${
              bar <= bars
                ? signalQuality === 'excellent' ? 'bg-green-500 h-4'
                : signalQuality === 'good' ? 'bg-blue-500 h-3'
                : signalQuality === 'fair' ? 'bg-yellow-500 h-2'
                : 'bg-red-500 h-1'
                : 'bg-gray-300 h-1'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = () => {
    if (error) return 'bg-red-50 border-red-200';
    if (isStable && signalQuality === 'excellent') return 'bg-green-50 border-green-200';
    if (signalQuality === 'good') return 'bg-blue-50 border-blue-200';
    if (signalQuality === 'fair') return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (error) return 'GPS Error';
    if (isLoading) return 'Acquiring GPS...';
    if (isStable) return 'GPS Stable';
    return 'GPS Active';
  };

  return (
    <div className={`relative`}>
      {/* Main Status Indicator */}
      <div className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg border backdrop-blur-sm
        ${getStatusColor()}
      `}>
        {getSignalIcon()}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-700">
            {getStatusText()}
          </span>
          {getSignalBars()}
        </div>
      </div>

      {/* Detailed Info Tooltip */}
      <div className="absolute top-full left-0 mt-1 z-50 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy:</span>
              <span className={`font-medium ${
                accuracy <= 10 ? 'text-green-600' 
                : accuracy <= 20 ? 'text-blue-600'
                : accuracy <= 35 ? 'text-yellow-600'
                : 'text-red-600'
              }`}>
                ±{accuracy.toFixed(1)}m
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Signal Quality:</span>
              <span className={`font-medium capitalize ${
                signalQuality === 'excellent' ? 'text-green-600'
                : signalQuality === 'good' ? 'text-blue-600'
                : signalQuality === 'fair' ? 'text-yellow-600'
                : 'text-red-600'
              }`}>
                {signalQuality}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Confidence:</span>
              <span className={`font-medium ${
                confidence > 0.8 ? 'text-green-600'
                : confidence > 0.6 ? 'text-blue-600'
                : confidence > 0.4 ? 'text-yellow-600'
                : 'text-red-600'
              }`}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${isStable ? 'text-green-600' : 'text-yellow-600'}`}>
                {isStable ? 'Stable' : 'Stabilizing'}
              </span>
            </div>
            
            {readingsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Readings:</span>
                <span className="font-medium text-gray-700">{readingsCount}</span>
              </div>
            )}
            
            {error && (
              <div className="pt-1 border-t border-gray-200">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signal Quality Indicator */}
      <div className="absolute -top-1 -right-1">
        <div className={`w-3 h-3 rounded-full border-2 border-white ${
          signalQuality === 'excellent' ? 'bg-green-500'
          : signalQuality === 'good' ? 'bg-blue-500'
          : signalQuality === 'fair' ? 'bg-yellow-500'
          : 'bg-red-500'
        } ${isLoading ? 'animate-pulse' : ''}`} />
      </div>
    </div>
  );
};
