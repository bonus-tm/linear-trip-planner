export interface Location {
  name: string;
  coordinates: { lat: number; lng: number };
  timezone: number; // -12 to +12 UTC offset
  daylight: Record<string, DaylightInfo>; // auto-calculated
}

export interface DaylightInfo {
  sunrise: string; // "HH:MM" format
  sunset: string;  // "HH:MM" format
  polar_night: boolean;
}

export interface Step {
  id: string; // Add unique identifier
  type: 'move' | 'stay';
  startDate: string; // ISO datetime or date
  finishDate: string;
  startLocation: string; // location name
  finishLocation?: string; // only for 'move' type
  startAirport?: string; // optional and only for 'move' type, 3 letters
  finishAirport?: string; // optional and only for 'move' type, 3 letters
  description?: string; // optional
}

export type LocationsMap = Record<string, Location>;
export type StepsList = Step[]; 