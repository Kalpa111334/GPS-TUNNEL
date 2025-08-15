import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: Language) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  isOpen,
  onToggle
}) => {
  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="btn-touch touch-feedback flex items-center space-x-1 sm:space-x-2 bg-white/90 backdrop-blur-sm text-gray-800 px-2 sm:px-4 py-2 rounded-full shadow-lg hover:bg-white transition-mobile border border-gray-200"
      >
        <Languages className="w-4 h-4" />
        <span className="text-lg sm:text-xl">{selectedLang?.flag}</span>
        <span className="font-medium text-sm sm:text-base hide-mobile">{selectedLang?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-2 min-w-48 max-w-xs z-50 animate-slide-down">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language);
                onToggle();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-blue-50 transition-mobile btn-touch touch-feedback ${
                selectedLanguage === language.code ? 'bg-blue-100' : ''
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <span className="font-medium text-sm sm:text-base">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};