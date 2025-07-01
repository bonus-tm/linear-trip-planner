export interface Location {
  id: string; // UUID string identifier for PouchDB compatibility
  name: string;
  coordinates: { lat: number; lng: number };
  timezone: number; // -12 to +12 UTC offset
}

export interface DaylightInfo {
  sunrise: string; // "HH:MM" format
  sunset: string;  // "HH:MM" format
  polar_night: boolean;
}

export type StepType = 'move' | 'stay'

export interface Step {
  id: string; // UUID identifier
  type: StepType;
  startDate: string; // ISO datetime or date
  finishDate: string;
  startTimestamp: number;
  finishTimestamp: number;
  startLocationId: string; // Location UUID for PouchDB compatibility
  finishLocationId?: string; // Location UUID for PouchDB compatibility, only for 'move' type
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
  timestamp: number;
  hasStay: boolean;
  hasMove: boolean;
  isEmpty: boolean;
  isWeekend: boolean;
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

export type ZoomLevel = number | 'fit';

// PouchDB Document Types

export interface Trip {
  created_at: number; // timestamp
  updated_at: number; // timestamp 
  deleted_at?: number; // timestamp, optional (soft delete)
  places: string;
  month: string;
  duration: string;
}

// PouchDB document metadata
export interface PouchDBMeta {
  _id: string;
  _rev?: string;
}

// PouchDB Document Schemas (as stored in database)
export interface LocationDocument extends PouchDBMeta {
  type: 'location';
  device_id: string; // UUID
  trip_id: string; // UUID
  location_id: string; // UUID
  name: string;
  coordinates: { lat: number; lng: number };
  timezone: number; // -12 to +12 UTC offset
  created_at: number; // timestamp
  updated_at: number; // timestamp
}

export interface StepDocument extends PouchDBMeta {
  type: 'step';
  device_id: string; // UUID
  trip_id: string; // UUID
  step_id: string; // UUID
  stepType: 'move' | 'stay';
  startDate: string; // ISO datetime
  finishDate: string; // ISO datetime  
  startTimestamp: number;
  finishTimestamp: number;
  startLocationId: string; // Location UUID only (device_id + trip_id can be derived from step document)
  finishLocationId?: string; // Location UUID only (only for 'move' type)
  startAirport?: string; // 3 letters, optional
  finishAirport?: string; // 3 letters, optional
  description?: string; // optional
  created_at: number; // timestamp
  updated_at: number; // timestamp
}

export interface TripDocument extends PouchDBMeta {
  type: 'trip';
  device_id: string; // UUID
  trip_id: string; // UUID
  created_at: number; // timestamp
  updated_at: number; // timestamp 
  deleted_at?: number; // timestamp, optional (soft delete)
  places: string;
  month: string;
  duration: string;
}

// Union type for all document types
export type DatabaseDocument = LocationDocument | StepDocument | TripDocument;
