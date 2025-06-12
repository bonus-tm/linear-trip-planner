export interface Location {
  name: string;
  coordinates: { lat: number; lng: number };
  timezone: number; // -12 to +12 UTC offset
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
  startTimestamp: number;
  finishTimestamp: number;
  startLocation: string; // location name
  finishLocation?: string; // only for 'move' type
  startAirport?: string; // optional and only for 'move' type, 3 letters
  finishAirport?: string; // optional and only for 'move' type, 3 letters
  description?: string; // optional
}

export type LocationsMap = Record<string, Location>
export type StepsList = Step[]

export type Position = {
  left: number
  top: number
  width?: number
  height?: number
}
export type CssStyle = {
  display?: string
  left?: string
  top?: string
  width?: string
  height?: string
}

export type Label = {
  text: string
  position: Position
  style: CssStyle
}

export interface TimelineLocation {
  name: string;
  timezone: number; // -12 to +12 UTC offset
  label: Label;
  top: number;
  days: DayBlock[];
}

export interface DayBlock {
  id: string;
  date: string;
  label: string;
  timestamp: number;
  hasStay: boolean;
  hasMove: boolean;
  isEmpty: boolean;
  position: Position;
  style: CssStyle;
  daylight?: DaylightInfo;
  daylightStyle?: CssStyle;
}

export interface MoveBlock {
  stepId: string;
  position: Position;
  style: CssStyle;
  labels: {
    beginTime: Label
    endTime: Label
    duration: Label
  };
}

export interface TimelineLayout {
  minTimestamp: number;
  maxTimestamp: number;
  width: number;
  height: number;
  locations: Record<string, TimelineLocation>;
  moves: MoveBlock[];
}