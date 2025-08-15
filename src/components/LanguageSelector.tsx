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
        className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 border border-gray-200"
      >
        <Languages className="w-4 h-4" />
        <span className="text-xl">{selectedLang?.flag}</span>
        <span className="font-medium">{selectedLang?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-2 min-w-48 z-50">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language);
                onToggle();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ${
                selectedLanguage === language.code ? 'bg-blue-100' : ''
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};