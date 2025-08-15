import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Position, TourPoint } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, Locate, Layers } from 'lucide-react';
import { throttle } from '../utils/mobileOptimizations';

interface Map3DProps {
  center: Position;
  tourPoints: TourPoint[];
  routePath?: Position[];
  currentPosition: Position | null;
  heading?: number;
  selectedLanguage: string;
  onPointClick?: (point: TourPoint) => void;
  isNavigating?: boolean;
  completedPoints?: string[];
  navigationRoute?: Position[];
  destination?: Position | null;
}

declare global {
  interface Window {
    google: any;
  }
}

export const Map3D: React.FC<Map3DProps> = ({
  center,
  tourPoints,
  routePath = [],
  currentPosition,
  heading = 0,
  selectedLanguage,
  onPointClick,
  isNavigating = false,
  completedPoints = [],
  navigationRoute = [],
  destination = null
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const routePathRef = useRef<any>(null);
  const navigationRouteRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const lastUpdateTime = useRef<number>(0);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('satellite');
  const [showControls, setShowControls] = useState(true);

  // Throttled map update functions to prevent flickering
  const throttledMapUpdate = useCallback(
    throttle((position: Position, mapHeading: number) => {
      if (!mapInstanceRef.current) return;
      
      const now = Date.now();
      if (now - lastUpdateTime.current < 200) return; // Limit updates to 5fps max
      
      lastUpdateTime.current = now;
      
      if (isNavigating) {
        // Smooth map center updates for navigation
        const currentCenter = mapInstanceRef.current.getCenter();
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(currentCenter.lat(), currentCenter.lng()),
          new google.maps.LatLng(position.lat, position.lng)
        );
        
        // Only update if position has changed significantly
        if (distance > 5) { // 5 meters threshold
          mapInstanceRef.current.panTo(position);
        }
        
        // Smooth heading updates
        if (mapHeading > 0) {
          const currentHeading = mapInstanceRef.current.getHeading() || 0;
          const headingDiff = Math.abs(mapHeading - currentHeading);
          
          if (headingDiff > 5) { // 5 degree threshold
            mapInstanceRef.current.setHeading(mapHeading);
          }
        }
      } else {
        mapInstanceRef.current.panTo(position);
      }
    }, 200),
    [isNavigating]
  );

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize mobile-optimized map with anti-flicker settings
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: isNavigating ? 19 : 14,
      mapTypeId: isNavigating ? 'roadmap' : 'satellite',
      tilt: isNavigating ? 0 : 45,
      heading: heading,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false, // Disabled for mobile
      zoomControl: false, // Custom controls for better mobile UX
      gestureHandling: 'greedy', // Better mobile touch handling
      clickableIcons: false, // Reduce accidental clicks on mobile
      disableDefaultUI: true, // Remove all default UI for clean mobile experience
      backgroundColor: '#f3f4f6', // Prevent white flashes during loading
      // Mobile performance optimizations
      maxZoom: isNavigating ? 21 : 18,
      minZoom: 8,
      restriction: {
        strictBounds: false,
        latLngBounds: null
      },
      // Reduce map complexity for smoother performance
      styles: isNavigating ? [
        // High contrast navigation styles
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { weight: 3 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#ffeb3b' }, { weight: 5 }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { weight: 4 }]
        }
      ] : [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [
            { color: '#0ea5e9' },
            { lightness: 10 }
          ]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [
            { color: '#f3f4f6' }
          ]
        }
      ]
    });

    // Add high-accuracy navigation route
    if (isNavigating && navigationRoute.length > 0) {
      navigationRouteRef.current = new window.google.maps.Polyline({
        path: navigationRoute,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 1,
        strokeWeight: 6,
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#1d4ed8',
            fillColor: '#3b82f6',
            fillOpacity: 1
          },
          offset: '0%',
          repeat: '30px'
        }]
      });
      
      navigationRouteRef.current.setMap(mapInstanceRef.current);
    }
    
    // Add tour route path if not navigating
    if (!isNavigating && routePath.length > 0) {
      routePathRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#06b6d4',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2,
            strokeColor: '#0891b2'
          },
          offset: '0%',
          repeat: '50px'
        }]
      });
      
      routePathRef.current.setMap(mapInstanceRef.current);
    }

    // Add destination marker for navigation
    if (isNavigating && destination) {
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: destination,
        map: mapInstanceRef.current,
        icon: {
          path: 'M 0,-40 L 15,-10 L 0,-20 L -15,-10 Z',
          scale: 2,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          anchor: new window.google.maps.Point(0, -20)
        },
        zIndex: 999,
        title: 'Destination',
        animation: window.google.maps.Animation.BOUNCE
      });
    }
    
    // Add simple tour route for waypoints (only when not navigating)
    if (!isNavigating && tourPoints.length > 1) {
      const waypointPath = tourPoints.map(point => point.position);
      
      routeRef.current = new window.google.maps.Polyline({
        path: waypointPath,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        strokeDashArray: '10,5',
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 4,
            strokeColor: '#1e40af'
          },
          offset: '0%',
          repeat: '100px'
        }]
      });
      
      routeRef.current.setMap(mapInstanceRef.current);
    }

    // Add tour point markers
    markersRef.current = tourPoints.map(point => {
      const isCompleted = completedPoints.includes(point.id);
      const marker = new window.google.maps.Marker({
        position: point.position,
        map: mapInstanceRef.current,
        title: point.title[selectedLanguage],
        icon: {
          url: getMarkerIcon(point.type, isCompleted),
          scaledSize: new window.google.maps.Size(40, 40),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: isCompleted ? 500 : 100
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-bold text-lg text-gray-800 mb-2">${point.title[selectedLanguage]}</h3>
            <p class="text-sm text-gray-600">${point.description[selectedLanguage]}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onPointClick) {
          onPointClick(point);
        }
      });

      return marker;
    });

  }, [center, tourPoints, routePath, selectedLanguage, onPointClick, completedPoints, isNavigating, navigationRoute, destination]);

  // Update current position marker with anti-flicker optimization
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    // Update marker position smoothly
    if (currentMarkerRef.current) {
      // Smooth position updates
      currentMarkerRef.current.setPosition(currentPosition);
      
      // Update icon rotation for heading
      const currentIcon = currentMarkerRef.current.getIcon();
      if (currentIcon && heading !== undefined) {
        currentMarkerRef.current.setIcon({
          ...currentIcon,
          rotation: heading
        });
      }
    } else {
      // Create marker only once
      currentMarkerRef.current = new window.google.maps.Marker({
        position: currentPosition,
        map: mapInstanceRef.current,
        icon: {
          path: isNavigating 
            ? 'M 0,-40 L 15,-8 L 0,-16 L -15,-8 Z' // Larger arrow for navigation
            : 'M 0,-30 L 12,-6 L 0,-12 L -12,-6 Z',
          scale: isNavigating ? 2.5 : 2,
          fillColor: isNavigating ? '#1d4ed8' : '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: isNavigating ? 4 : 3,
          rotation: heading || 0,
          anchor: new window.google.maps.Point(0, 0)
        },
        zIndex: 1000,
        title: isNavigating ? 'Navigating - Current Position' : 'Your Current Location',
        optimized: true // Enable marker optimization for better performance
      });
    }

    // Use throttled map updates to prevent flickering
    throttledMapUpdate(currentPosition, heading || 0);
    
    // Set appropriate zoom level once
    if (isNavigating && mapInstanceRef.current.getZoom() < 19) {
      mapInstanceRef.current.setZoom(19);
    } else if (!isNavigating && mapInstanceRef.current.getZoom() < 16) {
      mapInstanceRef.current.setZoom(16);
    }
  }, [currentPosition, heading, isNavigating, throttledMapUpdate]);

  const getMarkerIcon = (type: string, isCompleted = false) => {
    const icons = {
      start: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxNkE4NUYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0yMCAxMEwxNiAyNEgyNEwyMCAxMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      waypoint: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMzQjgyRjYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjYiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      restaurant: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNFQTU4MEMiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxyZWN0IHg9IjE4IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEyIiB5PSIxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      scenic: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxNEI4QTYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0yMCAxMkwyNCAyMEgxNkwyMCAxMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiAyNEgyOFYyNkgxMlYyNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      end: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNEQzI2MjYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxyZWN0IHg9IjE0IiB5PSIxOCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      // Completed marker icons (with checkmark)
      completed: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxNkE4NUYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0xNSAyMEwxOCAyM0wyNSAxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg=='
    };
    
    if (isCompleted) {
      return icons.completed;
    }
    
    return icons[type as keyof typeof icons] || icons.waypoint;
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(Math.min(currentZoom + 1, 21));
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentPosition) {
      mapInstanceRef.current.panTo(currentPosition);
      if (heading > 0) {
        mapInstanceRef.current.setHeading(heading);
      }
    }
  };

  const handleResetRotation = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setHeading(0);
      mapInstanceRef.current.setTilt(45);
    }
  };

  const cycleMapType = () => {
    const types: Array<'roadmap' | 'satellite' | 'hybrid'> = ['roadmap', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextType = types[(currentIndex + 1) % types.length];
    setMapType(nextType);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(nextType);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl bg-gray-100">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="map-viewport-mobile"
      />
      
      {/* Mobile Map Controls */}
      {showControls && (
        <div className="map-controls-mobile">
          {/* Map Type Toggle */}
          <button
            onClick={cycleMapType}
            className="map-control-btn mb-2"
            title="Change Map Type"
          >
            <Layers className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Zoom Controls */}
          <div className="space-y-1">
            <button
              onClick={handleZoomIn}
              className="map-control-btn"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="map-control-btn"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          {/* Location & Rotation Controls */}
          <div className="space-y-1 mt-2">
            {currentPosition && (
              <button
                onClick={handleRecenter}
                className="map-control-btn"
                title="Center on Location"
              >
                <Locate className="w-5 h-5 text-blue-600" />
              </button>
            )}
            <button
              onClick={handleResetRotation}
              className="map-control-btn"
              title="Reset Rotation"
            >
              <RotateCcw className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}
      
      {/* Map Type Indicator */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
        {mapType.toUpperCase()}
      </div>
    </div>
  );
};