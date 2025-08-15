import { useState, useEffect, useRef } from 'react';
import { Position } from '../types';
import { LANGUAGES } from '../data/languages';

interface VoiceNavigationOptions {
  language: string;
  volume: number;
  rate?: number;
  pitch?: number;
}

export const useVoiceNavigation = (
  currentPosition: Position | null,
  isNavigating: boolean,
  currentInstruction: string | null,
  nextInstruction: string | null,
  remainingDistance: number,
  selectedLanguage: string
) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isEnabled, setIsEnabled] = useState(true);
  const lastAnnouncedInstruction = useRef<string | null>(null);
  const lastDistanceAnnouncement = useRef<number>(0);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string, options?: Partial<VoiceNavigationOptions>) => {
    if (!isEnabled || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
    if (!selectedLang) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang.voice;
    utterance.volume = options?.volume ?? volume;
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtterance.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const announceInstruction = (instruction: string) => {
    if (instruction && instruction !== lastAnnouncedInstruction.current) {
      speak(instruction);
      lastAnnouncedInstruction.current = instruction;
    }
  };

  const announceDistance = (distance: number) => {
    const distanceThresholds = [1000, 500, 200, 100, 50]; // meters
    
    for (const threshold of distanceThresholds) {
      if (distance <= threshold && lastDistanceAnnouncement.current > threshold) {
        const distanceText = getDistanceAnnouncement(distance, selectedLanguage);
        speak(distanceText);
        lastDistanceAnnouncement.current = distance;
        break;
      }
    }
  };

  const getDistanceAnnouncement = (distance: number, language: string): string => {
    const announcements = {
      en: {
        1000: 'In 1 kilometer, ',
        500: 'In 500 meters, ',
        200: 'In 200 meters, ',
        100: 'In 100 meters, ',
        50: 'In 50 meters, ',
        arrived: 'You have arrived at your destination'
      },
      si: {
        1000: 'කිලෝමීටර 1 කින්, ',
        500: 'මීටර 500 කින්, ',
        200: 'මීටර 200 කින්, ',
        100: 'මීටර 100 කින්, ',
        50: 'මීටර 50 කින්, ',
        arrived: 'ඔබ ඔබේ ගමනාන්තයට පැමිණ ඇත'
      },
      ta: {
        1000: '1 கிலோமீட்டரில், ',
        500: '500 மீட்டரில், ',
        200: '200 மீட்டரில், ',
        100: '100 மீட்டரில், ',
        50: '50 மீட்டரில், ',
        arrived: 'நீங்கள் உங்கள் இலக்கை அடைந்துவிட்டீர்கள்'
      },
      ja: {
        1000: '1キロメートル先で、',
        500: '500メートル先で、',
        200: '200メートル先で、',
        100: '100メートル先で、',
        50: '50メートル先で、',
        arrived: '目的地に到着しました'
      },
      zh: {
        1000: '1公里后，',
        500: '500米后，',
        200: '200米后，',
        100: '100米后，',
        50: '50米后，',
        arrived: '您已到达目的地'
      }
    };

    const langAnnouncements = announcements[language as keyof typeof announcements] || announcements.en;
    
    if (distance <= 25) {
      return langAnnouncements.arrived;
    }
    
    for (const threshold of [1000, 500, 200, 100, 50]) {
      if (distance <= threshold) {
        return langAnnouncements[threshold as keyof typeof langAnnouncements] as string;
      }
    }
    
    return '';
  };

  // Handle navigation announcements
  useEffect(() => {
    if (!isNavigating || !currentInstruction) return;

    // Announce current instruction if it's new
    announceInstruction(currentInstruction);

    // Announce distance-based updates
    if (remainingDistance > 0) {
      announceDistance(remainingDistance);
    }

  }, [isNavigating, currentInstruction, remainingDistance, selectedLanguage]);

  // Handle arrival announcement
  useEffect(() => {
    if (isNavigating && remainingDistance <= 25 && remainingDistance > 0) {
      const arrivalText = getDistanceAnnouncement(0, selectedLanguage);
      speak(arrivalText);
    }
  }, [remainingDistance, isNavigating, selectedLanguage]);

  const adjustVolume = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
    if (!isEnabled) {
      stopSpeaking();
    }
  };

  return {
    isSpeaking,
    volume,
    isEnabled,
    speak,
    stopSpeaking,
    adjustVolume,
    toggleEnabled,
    announceInstruction,
    announceDistance
  };
};