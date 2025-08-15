import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer } from 'lucide-react';
import { Position } from '../types';

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  visibility: number;
}

interface WeatherWidgetProps {
  position: Position | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ position }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (position) {
      fetchWeatherData(position);
    }
  }, [position]);

  const fetchWeatherData = async (pos: Position) => {
    setIsLoading(true);
    try {
      // Simulated weather data - in production, you'd use a weather API
      const mockWeather: WeatherData = {
        temperature: Math.round(15 + Math.random() * 10),
        condition: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
        windSpeed: Math.round(5 + Math.random() * 15),
        humidity: Math.round(60 + Math.random() * 30),
        visibility: Math.round(8 + Math.random() * 7)
      };
      
      setTimeout(() => {
        setWeather(mockWeather);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return Sun;
      case 'cloudy': return Cloud;
      case 'rainy': return CloudRain;
      default: return Sun;
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'Sunny';
      case 'cloudy': return 'Cloudy';
      case 'partly-cloudy': return 'Partly Cloudy';
      case 'rainy': return 'Rainy';
      default: return 'Clear';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold text-sm">Canal Conditions</h4>
        <WeatherIcon className="w-5 h-5 text-yellow-400" />
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-white">{weather.temperature}°C</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 text-blue-400" />
          <span className="text-white">{weather.windSpeed} km/h</span>
        </div>
        
        <div className="col-span-2">
          <span className="text-white/80">{getConditionText(weather.condition)}</span>
          <div className="text-white/60 text-xs mt-1">
            Visibility: {weather.visibility}km • Humidity: {weather.humidity}%
          </div>
        </div>
      </div>
    </div>
  );
};