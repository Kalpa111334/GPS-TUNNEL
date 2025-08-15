import React from 'react';
import { Play, Pause, Square, Navigation } from 'lucide-react';

interface TourControlsProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isLoading: boolean;
}

export const TourControls: React.FC<TourControlsProps> = ({
  isActive,
  onStart,
  onPause,
  onStop,
  isLoading
}) => {
  return (
    <div className="flex items-center space-x-4">
      {!isActive ? (
        <button
          onClick={onStart}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          <span className="font-semibold">
            {isLoading ? 'Getting Location...' : 'Start Tour'}
          </span>
        </button>
      ) : (
        <>
          <button
            onClick={onPause}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-orange-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
          <button
            onClick={onStop}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        </>
      )}
    </div>
  );
};