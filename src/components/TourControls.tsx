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
    <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-2">
      {!isActive ? (
        <button
          onClick={onStart}
          disabled={isLoading}
          className="btn-touch touch-feedback flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 sm:px-6 py-3 rounded-full shadow-lg hover:from-blue-700 hover:to-teal-700 transition-mobile disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
        >
          <Play className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="font-semibold text-sm sm:text-base">
            {isLoading ? 'Getting Location...' : 'Start Tour'}
          </span>
        </button>
      ) : (
        <>
          <button
            onClick={onPause}
            className="btn-touch touch-feedback flex items-center space-x-1 sm:space-x-2 bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:bg-orange-700 transition-mobile"
          >
            <Pause className="w-4 h-4" />
            <span className="text-sm sm:text-base">Pause</span>
          </button>
          <button
            onClick={onStop}
            className="btn-touch touch-feedback flex items-center space-x-1 sm:space-x-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:bg-red-700 transition-mobile"
          >
            <Square className="w-4 h-4" />
            <span className="text-sm sm:text-base">Stop</span>
          </button>
        </>
      )}
    </div>
  );
};