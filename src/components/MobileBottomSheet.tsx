import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  title: string;
  defaultExpanded?: boolean;
  snapPoints?: number[]; // Heights as percentages of screen height
  className?: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  children,
  title,
  defaultExpanded = false,
  snapPoints = [25, 50, 85],
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultExpanded ? 1 : 0);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swipe down - collapse or go to lower snap point
        if (currentSnapPoint > 0) {
          setCurrentSnapPoint(currentSnapPoint - 1);
          setIsExpanded(currentSnapPoint - 1 > 0);
        }
      } else {
        // Swipe up - expand or go to higher snap point
        if (currentSnapPoint < snapPoints.length - 1) {
          setCurrentSnapPoint(currentSnapPoint + 1);
          setIsExpanded(true);
        }
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setCurrentSnapPoint(newExpanded ? 1 : 0);
  };

  const currentHeight = snapPoints[currentSnapPoint];

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={() => {
            setIsExpanded(false);
            setCurrentSnapPoint(0);
          }}
        />
      )}
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-all duration-300 ease-out safe-area-bottom ${className}`}
        style={{
          height: `${currentHeight}vh`,
          transform: isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)'
        }}
      >
        {/* Handle */}
        <div 
          className="flex flex-col items-center py-3 cursor-pointer touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleExpanded}
        >
          <div className="swipe-indicator mb-2" />
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  );
};
