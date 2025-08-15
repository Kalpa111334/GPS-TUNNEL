export interface Position {
  lat: number;
  lng: number;
}

export interface TourPoint {
  id: string;
  position: Position;
  title: Record<string, string>;
  description: Record<string, string>;
  type: 'start' | 'waypoint' | 'restaurant' | 'scenic' | 'end';
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  voice: string;
}

export interface TourState {
  isActive: boolean;
  currentPosition: Position | null;
  nextWaypoint: TourPoint | null;
  distance: number;
  speed: number;
  heading: number;
}