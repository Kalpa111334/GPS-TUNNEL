import React, { useState } from 'react';
import { Navigation, MapPin, X } from 'lucide-react';
import { Position } from '../types';

interface StartNavigateButtonProps {
  onStartNavigation: (destination: Position) => void;
  isCalculating: boolean;
  currentPosition: Position | null;
}

export const StartNavigateButton: React.FC<StartNavigateButtonProps> = ({
  onStartNavigation,
  isCalculating,
  currentPosition
}) => {
  const [showDestinationInput, setShowDestinationInput] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleStartNavigation = () => {
    if (!currentPosition) {
      alert('Current location not available. Please wait for GPS to initialize.');
      return;
    }
    setShowDestinationInput(true);
  };

  const searchDestination = async () => {
    if (!destinationInput.trim()) return;

    setIsSearching(true);
    try {
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address: destinationInput }, (results: any[], status: any) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const location = results[0].geometry.location;
            const destination: Position = {
              lat: location.lat(),
              lng: location.lng()
            };
            onStartNavigation(destination);
            setShowDestinationInput(false);
            setDestinationInput('');
          } else {
            alert('Destination not found. Please try a different address.');
          }
          setIsSearching(false);
        });
      } else {
        // Fallback: try to parse coordinates
        const coords = destinationInput.split(',').map(s => parseFloat(s.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          onStartNavigation({ lat: coords[0], lng: coords[1] });
          setShowDestinationInput(false);
          setDestinationInput('');
        } else {
          alert('Please enter coordinates in format: latitude, longitude');
        }
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for destination. Please try again.');
      setIsSearching(false);
    }
  };

  const handleQuickDestination = (destination: Position, name: string) => {
    onStartNavigation(destination);
    setShowDestinationInput(false);
  };

  // Quick destinations
  const quickDestinations: { name: string; position: Position }[] = [];

  return (
    <>
      <button
        onClick={handleStartNavigation}
        disabled={isCalculating || !currentPosition}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
      >
        <Navigation className="w-6 h-6" />
        <span>
          {isCalculating ? 'Calculating Route...' : 
           !currentPosition ? 'Getting Location...' : 
           'Start Navigate'}
        </span>
      </button>

      {/* Destination Input Modal */}
      {showDestinationInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <MapPin className="w-6 h-6 text-blue-600 mr-2" />
                Choose Destination
              </h3>
              <button
                onClick={() => setShowDestinationInput(false)}
                className="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter destination address or coordinates
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="e.g., Anne Frank House, Amsterdam or 52.3752, 4.8840"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && searchDestination()}
                />
                <button
                  onClick={searchDestination}
                  disabled={isSearching || !destinationInput.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? '...' : 'Go'}
                </button>
              </div>
            </div>

            {/* Quick Destinations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Destinations</h4>
              <div className="space-y-2">
                {quickDestinations.map((dest, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickDestination(dest.position, dest.name)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-800">{dest.name}</div>
                    <div className="text-sm text-gray-500">
                      {dest.position.lat.toFixed(4)}, {dest.position.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};