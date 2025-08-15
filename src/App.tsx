import React, { useState, useEffect, useRef } from 'react';
import { Anchor, Navigation2, RefreshCw } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { VolumeControl } from './components/VolumeControl';
import { TourControls } from './components/TourControls';
import { TourInfo } from './components/TourInfo';
import { Map3D } from './components/Map3D';
import { LocationStatus } from './components/LocationStatus';
import { RoutePreview } from './components/RoutePreview';
import { WeatherWidget } from './components/WeatherWidget';
import { TourProgress } from './components/TourProgress';
import { EmergencyContact } from './components/EmergencyContact';
import { NavigationView } from './components/NavigationView';
import { StartNavigateButton } from './components/StartNavigateButton';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { TouchGestureHandler } from './components/TouchGestureHandler';
import { useGeolocation } from './hooks/useGeolocation';
import { useStableGPS } from './hooks/useStableGPS';
import { GPSStatusIndicator } from './components/GPSStatusIndicator';
import { useTourRoute } from './hooks/useTourRoute';
import { useSpeech } from './hooks/useSpeech';
import { useTourProgress } from './hooks/useTourProgress';
import { useNavigation } from './hooks/useNavigation';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';
import { LANGUAGES } from './data/languages';
import { TourPoint, Language, Position } from './types';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [lastAnnouncedPoint, setLastAnnouncedPoint] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showMobileControls, setShowMobileControls] = useState(false);
  
  // Use stable GPS for better accuracy and reduced flickering
  const stableGPS = useStableGPS({
    minAccuracy: 3,
    maxAccuracy: 50,
    smoothingFactor: 0.2,
    outlierThreshold: 25,
    minUpdateInterval: 300,
    enableKalmanFilter: true,
    enableMedianFilter: true,
    enableConfidenceFiltering: true
  });

  // Fallback to regular geolocation for compatibility
  const fallbackGPS = useGeolocation();

  // Use stable GPS if available, otherwise fallback
  const { 
    position, 
    error, 
    isLoading, 
    accuracy, 
    currentAddress,
    startTracking, 
    stopTracking
  } = stableGPS.smoothedPosition ? {
    position: stableGPS.smoothedPosition,
    error: stableGPS.error,
    isLoading: stableGPS.isLoading,
    accuracy: stableGPS.accuracy,
    currentAddress: fallbackGPS.currentAddress, // Use fallback for address
    startTracking: stableGPS.startTracking,
    stopTracking: stableGPS.stopTracking
  } : fallbackGPS;

  // Additional GPS data for status display
  const speed = fallbackGPS.speed || 0;
  const heading = fallbackGPS.heading || 0;
  const hasPermission = fallbackGPS.hasPermission;
  
  const { 
    tourPoints, 
    routePath, 
    isLoading: isRouteLoading, 
    error: routeError,
    regenerateRoute 
  } = useTourRoute(position);
  
  const {
    navigationState,
    destination,
    error: navigationError,
    isCalculatingRoute,
    startNavigation,
    stopNavigation,
    getCurrentInstruction,
    getNextInstruction
  } = useNavigation(position);

  const { speak, stop: stopSpeech, volume, adjustVolume, isSpeaking } = useSpeech();

  // Voice navigation for turn-by-turn directions
  useVoiceNavigation(
    position,
    navigationState.isNavigating,
    getCurrentInstruction(),
    getNextInstruction(),
    navigationState.remainingDistance,
    selectedLanguage
  );
  
  const {
    currentIndex,
    completedPoints,
    visitedPoints,
    resetProgress,
    getCurrentPoint,
    getNextPoint,
    getProgressPercentage
  } = useTourProgress(position, tourPoints, isTourActive);

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = pos1.lat * Math.PI / 180;
    const lat2Rad = pos2.lat * Math.PI / 180;
    const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const deltaLng = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language.code);
    const selectedLang = LANGUAGES.find(lang => lang.code === language.code);
    if (selectedLang) {
      speak(
        language.code === 'en' ? 'Language changed to English' :
        language.code === 'si' ? 'භාෂාව සිංහලට වෙනස් කරන ලදී' :
        language.code === 'ta' ? 'மொழி தமிழ் என மாற்றப்பட்டது' :
        language.code === 'ja' ? '言語が日本語に変更されました' :
        '语言已更改为中文',
        selectedLang.voice
      );
    }
  };

  const handleStartTour = () => {
    setIsTourActive(true);
    resetProgress();
    startTracking({ enableHighAccuracy: true, timeout: 15000, maximumAge: 500 });
    
    const welcomeMessages = {
      en: 'Welcome aboard the Dutch Trails Restaurant dining boat tour! Your culinary journey through Amsterdam\'s beautiful canals begins now.',
      si: 'ඩච් ට්‍රේල්ස් අවන්හලේ ආහාර බෝට්ටු සංචාරයට සාදරයෙන් පිළිගනිමු! ඇම්ස්ටර්ඩෑම්හි සුන්දර ඇල මාර්ග හරහා ඔබේ ආහාර ගමන දැන් ආරම්භ වේ.',
      ta: 'டச் ட்ரெயில்ஸ் உணவக உணவு படகு பயணத்திற்கு வரவேற்கிறோம்! ஆம்ஸ்டர்டாமின் அழகிய கால்வாய்கள் வழியாக உங்கள் சமையல் பயணம் இப்போது தொடங்குகிறது.',
      ja: 'ダッチ・トレイルズレストランのダイニングボートツアーへようこそ！アムステルダムの美しい運河を巡るグルメ旅行が今始まります。',
      zh: '欢迎登上荷兰小径餐厅用餐船之旅！您穿越阿姆斯特丹美丽运河的美食之旅现在开始了。'
    };

    const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
    if (selectedLang) {
      speak(welcomeMessages[selectedLanguage as keyof typeof welcomeMessages], selectedLang.voice);
    }
  };

  const handleStopTour = () => {
    setIsTourActive(false);
    setLastAnnouncedPoint(null);
    resetProgress();
    stopTracking();
    stopSpeech();
  };

  const handleRegenerateRoute = async () => {
    if (regenerateRoute) {
      try {
        await regenerateRoute();
        const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
        if (selectedLang) {
          speak('Route updated with new destinations', selectedLang.voice);
        }
      } catch (err) {
        console.error('Failed to regenerate route:', err);
      }
    }
  };

  // Check proximity to tour points and announce
  useEffect(() => {
    if (!isTourActive || !position || tourPoints.length === 0) return;

    const currentPoint = getCurrentPoint();
    if (!currentPoint) return;

    const distance = calculateDistance(position, currentPoint.position);
    
    // If within 50 meters and haven't announced this point yet
    if (distance <= 50 && lastAnnouncedPoint !== currentPoint.id) {
      const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
      if (selectedLang) {
        const announcement = `${currentPoint.title[selectedLanguage]}. ${currentPoint.description[selectedLanguage]}`;
        speak(announcement, selectedLang.voice);
        setLastAnnouncedPoint(currentPoint.id);
      }

      // Check if tour is completed
      if (completedPoints.length === tourPoints.length) {
        // Tour completed
        setTimeout(() => {
          const completionMessages = {
            en: 'Congratulations! You have completed your dining boat tour. Thank you for choosing Dutch Trails Restaurant.',
            si: 'සුභ පැතුම්! ඔබ ඔබේ ආහාර බෝට්ටු සංචාරය සම්පූර්ණ කර ඇත. ඩච් ට්‍රේල්ස් අවන්හල තෝරාගැනීම පිළිබඳ ස්තූතියි.',
            ta: 'வாழ்த்துகள்! நீங்கள் உங்கள் உணவு படகு பயணத்தை முடித்துவிட்டீர்கள். டச் ட்ரெயில்ஸ் உணவகத்தைத் தேர்ந்தெடுத்ததற்கு நன்றி.',
            ja: 'おめでとうございます！ダイニングボートツアーが完了しました。ダッチ・トレイルズレストランをお選びいただき、ありがとうございました。',
            zh: '恭喜！您已完成用餐船之旅。感谢您选择荷兰小径餐厅。'
          };

          if (selectedLang) {
            speak(completionMessages[selectedLanguage as keyof typeof completionMessages], selectedLang.voice);
          }
          
          setTimeout(() => {
            handleStopTour();
          }, 5000);
        }, 2000);
      }
    }
  }, [position, isTourActive, getCurrentPoint, lastAnnouncedPoint, selectedLanguage, tourPoints, completedPoints]);

  const getCurrentDistance = (): number => {
    if (!position || !isTourActive) return 0;
    const targetPoint = getCurrentPoint();
    if (!targetPoint) return 0;
    return calculateDistance(position, targetPoint.position);
  };

  // Check for mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Default center to Amsterdam if no position yet
  const mapCenter = position || { lat: 52.3676, lng: 4.9041 };
  const nextPoint = getNextPoint();
  const currentPoint = getCurrentPoint();
  
  // Calculate estimated duration and total distance for route preview
  const estimatedDuration = tourPoints.length * 15; // 15 minutes per point
  const totalDistance = tourPoints.reduce((total, point, index) => {
    if (index === 0) return 0;
    const prevPoint = tourPoints[index - 1];
    return total + calculateDistance(point.position, prevPoint.position);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 safe-area-top safe-area-bottom">
      {/* Navigation View Overlay */}
      <NavigationView
        isNavigating={navigationState.isNavigating}
        currentInstruction={getCurrentInstruction()}
        nextInstruction={getNextInstruction()}
        remainingDistance={navigationState.remainingDistance}
        remainingTime={navigationState.remainingTime}
        destination={destination}
        onStopNavigation={stopNavigation}
      />

      {/* Header */}
      <div className={`bg-white/10 backdrop-blur-sm border-b border-white/20 sticky-mobile ${navigationState.isNavigating ? 'mt-16 sm:mt-32' : ''}`}>
        <div className="mobile-container py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 btn-touch">
                <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="heading-responsive font-bold text-white truncate">GPS TUNNEL</h1>
                <p className="text-blue-100 text-xs sm:text-sm truncate">Dutch Trails Restaurant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                isOpen={isLanguageSelectorOpen}
                onToggle={() => setIsLanguageSelectorOpen(!isLanguageSelectorOpen)}
              />
              
              <VolumeControl
                volume={volume}
                onVolumeChange={adjustVolume}
                isSpeaking={isSpeaking}
              />
              
              {tourPoints.length > 0 && (
                <button
                  onClick={handleRegenerateRoute}
                  disabled={isRouteLoading}
                  className="btn-touch touch-feedback flex items-center space-x-1 sm:space-x-2 bg-white/90 backdrop-blur-sm text-gray-800 px-3 sm:px-4 py-2 rounded-full shadow-lg hover:bg-white transition-mobile border border-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRouteLoading ? 'animate-spin' : ''}`} />
                  <span className="font-medium text-xs sm:text-sm hide-mobile">Update Route</span>
                  <span className="font-medium text-xs show-mobile">Update</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-container py-4 sm:py-6">
        <div className={`grid ${isMobileView ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
          {/* Map Section */}
          <div className={`${isMobileView ? 'col-span-1' : 'lg:col-span-2'} order-1 lg:order-1`}>
            <TouchGestureHandler
              onSwipeUp={() => isMobileView && setShowMobileControls(true)}
              onSwipeDown={() => isMobileView && setShowMobileControls(false)}
              onDoubleTap={() => {
                if (currentPosition) {
                  // Double tap to recenter map - functionality will be handled in Map3D component
                  console.log('Double tap to recenter');
                }
              }}
            >
              <div className="mobile-card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                  <Navigation2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">3D Navigation View</span>
                  <span className="sm:hidden">Navigation</span>
                </h2>
                
                <div className="text-white/80 text-xs sm:text-sm">
                  {position ? (
                    <span>📍 {currentAddress || 'Live Tracking Active'}</span>
                  ) : isLoading ? (
                    <span>📍 Getting Location...</span>
                  ) : error ? (
                    <span>📍 Location Error</span>
                  ) : (
                    <span>📍 Location Services Ready</span>
                  )}
                </div>
              </div>

              <div className="map-container-mobile">
                {window.google ? (
                  <Map3D
                    center={mapCenter}
                    tourPoints={tourPoints}
                    routePath={routePath}
                    currentPosition={position}
                    heading={heading}
                    selectedLanguage={selectedLanguage}
                    isNavigating={navigationState.isNavigating || isTourActive}
                    completedPoints={completedPoints}
                    navigationRoute={navigationState.routePath}
                    destination={destination}
                    onPointClick={(point) => {
                      const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
                      if (selectedLang) {
                        speak(
                          `${point.title[selectedLanguage]}. ${point.description[selectedLanguage]}`,
                          selectedLang.voice
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading Google Maps...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </TouchGestureHandler>
          </div>

          {/* Controls Section - Desktop or Mobile Bottom Sheet */}
          {isMobileView ? (
            <MobileBottomSheet
              title="Tour Controls"
              defaultExpanded={showMobileControls}
              snapPoints={[15, 40, 75]}
              className="lg:hidden"
            >
              <div className="touch-spacing">
                {renderControlsContent()}
              </div>
            </MobileBottomSheet>
          ) : (
            <div className="touch-spacing order-2 lg:order-2">
              {renderControlsContent()}
            </div>
          )}
        </div>
      </div>
      
      {/* Emergency Contact Button */}
      <EmergencyContact currentPosition={position} />
    </div>
  );
  
  function renderControlsContent() {
    return (
      <>
        {/* Weather Widget */}
        <WeatherWidget position={position} />
            
        {/* Tour Controls */}
        <div className="mobile-card p-4 sm:p-6">
          <h3 className="heading-responsive font-bold text-white mb-3 sm:mb-4">Tour Controls</h3>
              
              <TourControls
                isActive={isTourActive}
                onStart={handleStartTour}
                onPause={() => stopSpeech()}
                onStop={handleStopTour}
                isLoading={isLoading}
              />

              {(error || routeError) && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error && <div>Location Error: {error}</div>}
                  {routeError && <div>Route Error: {routeError}</div>}
                  {navigationError && <div>Navigation Error: {navigationError}</div>}
                </div>
              )}
              
          <div className="flex space-x-2">
            <LocationStatus
              isConnected={hasPermission && !!position && !error}
              accuracy={accuracy}
              speed={speed}
              error={error}
            />
            
            {/* Enhanced GPS Status Indicator */}
            <GPSStatusIndicator
              accuracy={stableGPS.accuracy || accuracy}
              signalQuality={stableGPS.signalQuality || (accuracy <= 10 ? 'excellent' : accuracy <= 20 ? 'good' : accuracy <= 35 ? 'fair' : 'poor')}
              confidence={stableGPS.confidence || 0.5}
              isStable={stableGPS.isStable || false}
              isLoading={isLoading}
              error={error}
              readingsCount={stableGPS.rawReadingsCount || 0}
            />
          </div>
        </div>

        {/* Tour Info */}
        {isTourActive && (
          <>
            <TourProgress
              tourPoints={tourPoints}
              currentIndex={currentIndex}
              selectedLanguage={selectedLanguage}
              completedPoints={completedPoints}
            />
            
            <TourInfo
              currentPoint={currentPoint}
              nextPoint={nextPoint}
              distance={getCurrentDistance()}
              speed={speed}
              selectedLanguage={selectedLanguage}
            />
          </>
        )}

        {/* Welcome Message */}
        {!isTourActive && !isNavigationMode && tourPoints.length === 0 && (
          <div className="mobile-card p-4 sm:p-6">
            <h3 className="heading-responsive font-bold text-white mb-3">
              {isRouteLoading ? 'Preparing Your Tour...' : 'Welcome to GPS Tunnel'}
            </h3>
            {isRouteLoading ? (
              <div className="flex items-center space-x-3 text-white/80">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Finding the best scenic routes and restaurants near you...</span>
              </div>
            ) : (
              <>
                <p className="text-white/80 text-responsive leading-relaxed mb-4">
                  Experience Amsterdam's canals like never before with our immersive 3D dining boat tour. 
                  Choose your preferred language and let us guide you through the most scenic waterways 
                  while you enjoy exceptional cuisine.
                </p>
                {tourPoints.length > 0 && (
                  <div className="bg-green-500/20 rounded-lg p-3 text-green-100 text-xs mb-4">
                    <strong>🎯 Route Ready:</strong> Found {tourPoints.length} amazing destinations including 
                    scenic viewpoints and waterfront restaurants along your personalized route.
                  </div>
                )}
              </>
            )}
            <div className="bg-blue-500/20 rounded-lg p-3 text-blue-100 text-xs">
              <strong>🎯 Features:</strong> Real-time GPS tracking, 3D maps, multi-language narration, 
              voice guidance, dynamic route optimization, and live location-based discoveries.
            </div>
          </div>
        )}
        
        {/* Route Preview */}
        {!isTourActive && !isNavigationMode && tourPoints.length > 0 && (
          <RoutePreview
            tourPoints={tourPoints}
            selectedLanguage={selectedLanguage}
            estimatedDuration={estimatedDuration}
            totalDistance={totalDistance}
            onStartTour={handleStartTour}
          />
        )}

        {/* Navigation Mode */}
        {!isTourActive && !isNavigationMode && position && (
          <div className="mobile-card p-4 sm:p-6">
            <h3 className="heading-responsive font-bold text-white mb-3 sm:mb-4 flex items-center">
              <Navigation2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Point-to-Point Navigation</span>
              <span className="sm:hidden">Navigation</span>
            </h3>
            <p className="text-white/80 text-responsive mb-4">
              Navigate directly to any destination with turn-by-turn voice guidance in your selected language.
            </p>
            <StartNavigateButton
              onStartNavigation={startNavigation}
              isCalculating={isCalculatingRoute}
              currentPosition={position}
            />
          </div>
        )}
      </>
    );
  }
}

export default App;