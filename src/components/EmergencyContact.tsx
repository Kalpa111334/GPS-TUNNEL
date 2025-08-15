import React, { useState } from 'react';
import { Phone, AlertTriangle, MapPin, X } from 'lucide-react';
import { Position } from '../types';

interface EmergencyContactProps {
  currentPosition: Position | null;
}

export const EmergencyContact: React.FC<EmergencyContactProps> = ({ currentPosition }) => {
  const [isOpen, setIsOpen] = useState(false);

  const emergencyContacts = [
    {
      name: 'Dutch Trails Restaurant',
      number: '+31-20-123-4567',
      type: 'Restaurant Emergency'
    },
    {
      name: 'Amsterdam Water Police',
      number: '112',
      type: 'Water Emergency'
    },
    {
      name: 'Coast Guard',
      number: '+31-20-987-6543',
      type: 'Marine Rescue'
    }
  ];

  const handleCall = (number: string) => {
    window.open(`tel:${number}`);
  };

  const shareLocation = () => {
    if (currentPosition && navigator.share) {
      navigator.share({
        title: 'My Current Location - Emergency',
        text: `I need assistance at coordinates: ${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`,
        url: `https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`
      });
    } else if (currentPosition) {
      const locationUrl = `https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`;
      navigator.clipboard.writeText(locationUrl);
      alert('Location copied to clipboard');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
        title="Emergency Contacts"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                Emergency Contacts
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.type}</p>
                      <p className="text-lg font-mono text-blue-600 mt-1">{contact.number}</p>
                    </div>
                    <button
                      onClick={() => handleCall(contact.number)}
                      className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition-colors"
                      title={`Call ${contact.name}`}
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentPosition && (
              <div className="border-t pt-4">
                <button
                  onClick={shareLocation}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Share My Location</span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Current: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};