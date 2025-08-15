import { Position, TourPoint } from '../types';

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  position: Position;
}

interface DetailedRoute {
  steps: RouteStep[];
  path: Position[];
  totalDistance: number;
  totalDuration: number;
}

declare global {
  interface Window {
    google: any;
  }
}

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private directionsService: any;
  private placesService: any;
  private geocoder: any;

  private constructor() {
    if (window.google) {
      this.directionsService = new window.google.maps.DirectionsService();
      this.geocoder = new window.google.maps.Geocoder();
    }
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  public async calculateDetailedRoute(start: Position, destination: Position): Promise<DetailedRoute> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        reject(new Error('Directions service not available'));
        return;
      }

      const request = {
        origin: new window.google.maps.LatLng(start.lat, start.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: true,
        avoidTolls: true,
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      this.directionsService.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const steps: RouteStep[] = leg.steps.map((step: any) => ({
            instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance.value,
            duration: step.duration.value,
            maneuver: step.maneuver || 'straight',
            position: {
              lat: step.start_location.lat(),
              lng: step.start_location.lng()
            }
          }));

          const path: Position[] = [];
          route.overview_path.forEach((point: any) => {
            path.push({
              lat: point.lat(),
              lng: point.lng()
            });
          });

          resolve({
            steps,
            path,
            totalDistance: leg.distance.value,
            totalDuration: leg.duration.value
          });
        } else {
          reject(new Error(`Route calculation failed: ${status}`));
        }
      });
    });
  }

  public async findNearbyRestaurants(center: Position, radius: number = 5000): Promise<TourPoint[]> {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.places?.PlacesService) {
        reject(new Error('Google Maps Places API not loaded'));
        return;
      }

      const map = new window.google.maps.Map(document.createElement('div'));
      this.placesService = new window.google.maps.places.PlacesService(map);

      const request = {
        location: new window.google.maps.LatLng(center.lat, center.lng),
        radius: radius,
        type: 'restaurant',
        keyword: 'waterfront dining canal boat'
      };

      this.placesService.nearbySearch(request, (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const tourPoints: TourPoint[] = results.slice(0, 3).map((place, index) => ({
            id: `restaurant_${index}`,
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            title: {
              en: place.name || 'Waterfront Restaurant',
              si: place.name || 'ජල පාර් අවන්හල',
              ta: place.name || 'நீர்ப்பக்க உணவகம்',
              ja: place.name || '水辺のレストラン',
              zh: place.name || '水边餐厅'
            },
            description: {
              en: `Scenic dining location with canal views. Rating: ${place.rating || 'N/A'}/5`,
              si: `ඇල දර්ශන සහිත දර්ශනීය ආහාර ස්ථානය. ශ්‍රේණිගත කිරීම: ${place.rating || 'N/A'}/5`,
              ta: `கால்வாய் காட்சிகளுடன் அழகிய உணவு இடம். மதிப்பீடு: ${place.rating || 'N/A'}/5`,
              ja: `運河の景色を楽しめる風景の良いダイニング。評価: ${place.rating || 'N/A'}/5`,
              zh: `可欣赏运河景色的风景餐厅。评分: ${place.rating || 'N/A'}/5`
            },
            type: 'restaurant' as const
          }));
          resolve(tourPoints);
        } else {
          reject(new Error('No restaurants found'));
        }
      });
    });
  }

  public async findScenicPoints(center: Position, radius: number = 3000): Promise<TourPoint[]> {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.places?.PlacesService) {
        reject(new Error('Google Maps Places API not loaded'));
        return;
      }

      const map = new window.google.maps.Map(document.createElement('div'));
      this.placesService = new window.google.maps.places.PlacesService(map);

      const request = {
        location: new window.google.maps.LatLng(center.lat, center.lng),
        radius: radius,
        type: 'tourist_attraction',
        keyword: 'bridge canal historic landmark'
      };

      this.placesService.nearbySearch(request, (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const tourPoints: TourPoint[] = results.slice(0, 4).map((place, index) => ({
            id: `scenic_${index}`,
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            title: {
              en: place.name || 'Scenic Point',
              si: place.name || 'දර්ශනීය ස්ථානය',
              ta: place.name || 'அழகிய இடம்',
              ja: place.name || '景勝地',
              zh: place.name || '风景点'
            },
            description: {
              en: `Historic landmark along the canal route. ${place.vicinity || ''}`,
              si: `ඇල මාර්ගය දිගේ ඓතිහාසික සලකුණ. ${place.vicinity || ''}`,
              ta: `கால்வாய் பாதையில் உள்ள வரலாற்று அடையாளம். ${place.vicinity || ''}`,
              ja: `運河沿いの歴史的ランドマーク。${place.vicinity || ''}`,
              zh: `运河沿线的历史地标。${place.vicinity || ''}`
            },
            type: 'scenic' as const
          }));
          resolve(tourPoints);
        } else {
          reject(new Error('No scenic points found'));
        }
      });
    });
  }

  public async calculateOptimalRoute(start: Position, waypoints: Position[]): Promise<Position[]> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        reject(new Error('Directions service not available'));
        return;
      }

      const waypointObjects = waypoints.map(wp => ({
        location: new window.google.maps.LatLng(wp.lat, wp.lng),
        stopover: true
      }));

      const request = {
        origin: new window.google.maps.LatLng(start.lat, start.lng),
        destination: new window.google.maps.LatLng(start.lat, start.lng), // Return to start
        waypoints: waypointObjects,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING, // Closest to boat travel
        avoidHighways: true,
        avoidTolls: true
      };

      this.directionsService.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const routePoints: Position[] = [];
          
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              const path = step.path || [step.start_location, step.end_location];
              path.forEach((point: any) => {
                routePoints.push({
                  lat: point.lat(),
                  lng: point.lng()
                });
              });
            });
          });
          
          resolve(routePoints);
        } else {
          reject(new Error(`Route calculation failed: ${status}`));
        }
      });
    });
  }

  public async reverseGeocode(position: Position): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }

      const latlng = new window.google.maps.LatLng(position.lat, position.lng);
      
      this.geocoder.geocode({ location: latlng }, (results: any[], status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  }
}