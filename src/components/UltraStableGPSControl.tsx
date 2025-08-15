import React from 'react';
import { Lock, Unlock, RotateCcw, Satellite, Target, AlertTriangle } from 'lucide-react';

interface UltraStableGPSControlProps {
  isLocked: boolean;
  isStable: boolean;
  accuracy: number;
  confidence: number;
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
  bufferSize: number;
  consecutiveGoodReadings: number;
  lockRadius: number;
  minimumAccuracy: number;
  onToggleLock: () => void;
  onReset: () => void;
  error?: string | null;
}

export const UltraStableGPSControl: React.FC<UltraStableGPSControlProps> = ({
  isLocked,
  isStable,
  accuracy,
  confidence,
  signalQuality,
  bufferSize,
  consecutiveGoodReadings,
  lockRadius,
  minimumAccuracy,
  onToggleLock,
  onReset,
  error
}) => {
  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50 border-red-200';
    if (isLocked) return 'text-green-600 bg-green-50 border-green-200';
    if (isStable) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (error) return <AlertTriangle className="w-4 h-4" />;
    if (isLocked) return <Lock className="w-4 h-4" />;
    if (isStable) return <Target className="w-4 h-4" />;
    return <Satellite className="w-4 h-4 animate-pulse" />;
  };

  const getStatusText = () => {
    if (error) return 'GPS Error';
    if (isLocked) return 'GPS Locked';
    if (isStable) return 'GPS Stable';
    return 'Stabilizing...';
  };

  const getQualityBars = () => {
    let bars = 0;
    switch (signalQuality) {
      case 'excellent': bars = 4; break;
      case 'good': bars = 3; break;
      case 'fair': bars = 2; break;
      case 'poor': bars = 1; break;
    }

    return (
      <div className="flex space-x-0.5 items-end">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all duration-200 ${
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

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">Ultra-Stable GPS</h3>
          {getQualityBars()}
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Accuracy:</span>
            <span className={`font-medium ${
              accuracy <= 5 ? 'text-green-600' 
              : accuracy <= 10 ? 'text-blue-600'
              : accuracy <= 20 ? 'text-yellow-600'
              : 'text-red-600'
            }`}>
              ±{accuracy.toFixed(1)}m
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
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Buffer:</span>
            <span className="font-medium text-gray-700">{bufferSize}/15</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Good Readings:</span>
            <span className={`font-medium ${
              consecutiveGoodReadings >= 5 ? 'text-green-600' 
              : consecutiveGoodReadings >= 3 ? 'text-blue-600'
              : 'text-yellow-600'
            }`}>
              {consecutiveGoodReadings}/5
            </span>
          </div>
        </div>
      </div>

      {/* Settings Display */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Lock Radius:</span>
          <span className="font-medium text-gray-700">±{lockRadius}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Min Accuracy:</span>
          <span className="font-medium text-gray-700">±{minimumAccuracy}m</span>
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
      </div>

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={onToggleLock}
          disabled={!isStable && !isLocked}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            isLocked
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : isStable
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isLocked ? 'Unlock GPS' : 'Lock GPS'}</span>
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
          title="Reset GPS buffer and unlock position"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm font-medium">GPS Error</p>
          </div>
          <p className="text-red-600 text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Lock Status */}
      {isLocked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-green-500" />
            <p className="text-green-700 text-sm font-medium">GPS Position Locked</p>
          </div>
          <p className="text-green-600 text-xs mt-1">
            Position is stabilized within ±{lockRadius}m radius
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
        <p className="font-medium mb-1">How it works:</p>
        <ul className="space-y-1">
          <li>• Filters GPS readings for accuracy &lt;{minimumAccuracy}m</li>
          <li>• Locks position after 5 consistent readings</li>
          <li>• Ignores GPS drift within ±{lockRadius}m radius</li>
          <li>• Auto-unlocks when real movement detected</li>
        </ul>
      </div>
    </div>
  );
};
