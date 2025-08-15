import React from 'react';
import { CheckCircle, Circle, MapPin, Clock } from 'lucide-react';
import { TourPoint } from '../types';

interface TourProgressProps {
  tourPoints: TourPoint[];
  currentIndex: number;
  selectedLanguage: string;
  completedPoints: string[];
}

export const TourProgress: React.FC<TourProgressProps> = ({
  tourPoints,
  currentIndex,
  selectedLanguage,
  completedPoints
}) => {
  const progress = (completedPoints.length / tourPoints.length) * 100;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Tour Progress
        </h3>
        <div className="text-white/80 text-sm">
          {completedPoints.length}/{tourPoints.length} completed
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-white/80 text-xs mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Points List */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {tourPoints.map((point, index) => {
          const isCompleted = completedPoints.includes(point.id);
          const isCurrent = index === currentIndex;
          
          return (
            <div 
              key={point.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isCurrent ? 'bg-blue-500/20 border border-blue-400/30' :
                isCompleted ? 'bg-green-500/10' : 'bg-white/5'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse"></div>
                ) : (
                  <Circle className="w-5 h-5 text-white/40" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${
                  isCurrent ? 'text-blue-200' : 
                  isCompleted ? 'text-green-200' : 'text-white/80'
                }`}>
                  {point.title[selectedLanguage]}
                </h4>
                
                {isCurrent && (
                  <div className="flex items-center mt-1 text-blue-300 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Current destination</span>
                  </div>
                )}
                
                {isCompleted && (
                  <div className="text-green-300 text-xs mt-1">
                    ✓ Visited
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};