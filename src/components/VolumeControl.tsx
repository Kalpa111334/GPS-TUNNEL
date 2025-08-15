import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  isSpeaking: boolean;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  isSpeaking
}) => {
  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
      <VolumeIcon 
        className={`w-5 h-5 ${isSpeaking ? 'text-orange-500 animate-pulse' : 'text-gray-600'}`} 
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #ea580c 0%, #ea580c ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
        }}
      />
      <span className="text-sm font-medium text-gray-600 w-8">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
};