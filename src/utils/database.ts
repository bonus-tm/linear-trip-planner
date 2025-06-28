import PouchDB from 'pouchdb';
import type { Location, LocationDocument, DatabaseDocument, Step, StepDocument, Trip, TripDocument } from '../types';
import { createLocationDocId, createStepDocId, createTripDocId, parseDocumentId } from './documentIds';
import { generateLocationId, generateStepId } from './ids';

// Database configuration
export const DB_NAME = 'timeline-data';

// Database instance with configuration from SPECS.md
let dbInstance: PouchDB.Database | null = null;

export function getDatabase(): PouchDB.Database {
  if (!dbInstance) {
    dbInstance = new PouchDB(DB_NAME, {
      auto_compaction: true,
      revs_limit: 10
    });
  }
  return dbInstance;
}

// Database initialization function
export async function initializeDatabase(): Promise<boolean> {
  try {
    const db = getDatabase();
    
    // Test database connectivity
    await db.info();
    
    // Configure database indexes for efficient querying
    await setupIndexes();
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    handleDatabaseError(error);
    return false;
  }
}

// Set up database indexes for efficient querying
async function setupIndexes(): Promise<void> {
  const db = getDatabase();
  
  try {
    // Create index for type + device_id + trip_id + created_at (from SPECS.md)
    await db.createIndex({
      index: {
        fields: ['type', 'device_id', 'trip_id', 'created_at']
      }
    });
    
    // Create index for document type filtering
    await db.createIndex({
      index: {
        fields: ['type']
      }
    });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create database indexes:', error);
    throw error;
  }
}

// LOCATION OPERATIONS

/**
 * Add a new location to PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID 
 * @param location - Location data without ID
 * @returns Promise<Location> - Created location with generated ID
 */
export async function addLocation(deviceId: string, tripId: string, location: Omit<Location, 'id'>): Promise<Location> {
  const db = getDatabase();
  
  try {
    const locationId = generateLocationId();
    const timestamp = Date.now();
    
    const locationDocument: LocationDocument = {
      _id: createLocationDocId(deviceId, tripId, locationId),
      type: 'location',
      device_id: deviceId,
      trip_id: tripId,
      location_id: locationId,
      data: {
        name: location.name,
        coordinates: location.coordinates,
        timezone: location.timezone
      },
      created_at: timestamp,
      updated_at: timestamp
    };
    
    await db.put(locationDocument);
    
    // Return the location in the format expected by the app
    const createdLocation: Location = {
      id: locationId,
      name: location.name,
      coordinates: location.coordinates,
      timezone: location.timezone
    };
    
    return createdLocation;
  } catch (error: any) {
    console.error('Error adding location:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Update an existing location in PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param locationId - Location UUID
 * @param data - Partial location data to update
 * @returns Promise<boolean> - Success status
 */
export async function updateLocation(deviceId: string, tripId: string, locationId: string, data: Partial<Omit<Location, 'id'>>): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createLocationDocId(deviceId, tripId, locationId);
    const existingDoc = await db.get<LocationDocument>(documentId);
    
    const updatedDocument: LocationDocument = {
      ...existingDoc,
      data: {
        ...existingDoc.data,
        ...data
      },
      updated_at: Date.now()
    };
    
    await db.put(updatedDocument);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Location with ID ${locationId} not found`);
    }
    console.error('Error updating location:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Delete a location from PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param locationId - Location UUID
 * @returns Promise<boolean> - Success status
 */
export async function deleteLocation(deviceId: string, tripId: string, locationId: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createLocationDocId(deviceId, tripId, locationId);
    const existingDoc = await db.get<LocationDocument>(documentId);
    
    await db.remove(existingDoc);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Location with ID ${locationId} not found`);
    }
    console.error('Error deleting location:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Get all locations for a specific device and trip
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @returns Promise<Location[]> - Array of locations
 */
export async function getLocations(deviceId: string, tripId: string): Promise<Location[]> {
  const db = getDatabase();
  
  try {
    // Query all location documents for this device + trip
    const result = await db.allDocs<LocationDocument>({
      include_docs: true,
      startkey: `${deviceId}>${tripId}>location>`,
      endkey: `${deviceId}>${tripId}>location>\ufff0`
    });
    
    return result.rows
      .filter(row => row.doc && row.doc.type === 'location')
      .map(row => {
        const doc = row.doc!;
        return {
          id: doc.location_id,
          name: doc.data.name,
          coordinates: doc.data.coordinates,
          timezone: doc.data.timezone
        } as Location;
      });
  } catch (error: any) {
    console.error('Error getting locations:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Get a location by its full document ID
 * @param locationDocId - Full location document ID
 * @returns Promise<Location | null> - Location or null if not found
 */
export async function getLocationByDocumentId(locationDocId: string): Promise<Location | null> {
  const db = getDatabase();
  
  try {
    const doc = await db.get<LocationDocument>(locationDocId);
    
    if (doc.type !== 'location') {
      return null;
    }
    
    return {
      id: doc.location_id,
      name: doc.data.name,
      coordinates: doc.data.coordinates,
      timezone: doc.data.timezone
    };
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error('Error getting location by document ID:', error);
    handleDatabaseError(error);
    throw error;
  }
}

// STEP OPERATIONS

/**
 * Add a new step to PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID 
 * @param step - Step data without ID
 * @returns Promise<Step> - Created step with generated ID
 */
export async function addStep(deviceId: string, tripId: string, step: Omit<Step, 'id'>): Promise<Step> {
  const db = getDatabase();
  
  try {
    const stepId = generateStepId();
    const timestamp = Date.now();
    
    const stepDocument: StepDocument = {
      _id: createStepDocId(deviceId, tripId, stepId),
      type: 'step',
      device_id: deviceId,
      trip_id: tripId,
      step_id: stepId,
      data: {
        type: step.type,
        startDate: step.startDate,
        finishDate: step.finishDate,
        startTimestamp: step.startTimestamp,
        finishTimestamp: step.finishTimestamp,
        startLocationId: step.startLocationId,
        finishLocationId: step.finishLocationId,
        startAirport: step.startAirport,
        finishAirport: step.finishAirport,
        description: step.description
      },
      created_at: timestamp,
      updated_at: timestamp
    };
    
    await db.put(stepDocument);
    
    // Return the step in the format expected by the app
    const createdStep: Step = {
      id: stepId,
      type: step.type,
      startDate: step.startDate,
      finishDate: step.finishDate,
      startTimestamp: step.startTimestamp,
      finishTimestamp: step.finishTimestamp,
      startLocationId: step.startLocationId,
      finishLocationId: step.finishLocationId,
      startAirport: step.startAirport,
      finishAirport: step.finishAirport,
      description: step.description
    };
    
    return createdStep;
  } catch (error: any) {
    console.error('Error adding step:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Update an existing step in PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param stepId - Step UUID
 * @param data - Partial step data to update
 * @returns Promise<boolean> - Success status
 */
export async function updateStep(deviceId: string, tripId: string, stepId: string, data: Partial<Omit<Step, 'id'>>): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createStepDocId(deviceId, tripId, stepId);
    const existingDoc = await db.get<StepDocument>(documentId);
    
    const updatedDocument: StepDocument = {
      ...existingDoc,
      data: {
        ...existingDoc.data,
        ...data
      },
      updated_at: Date.now()
    };
    
    await db.put(updatedDocument);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Step with ID ${stepId} not found`);
    }
    console.error('Error updating step:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Delete a step from PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param stepId - Step UUID
 * @returns Promise<boolean> - Success status
 */
export async function deleteStep(deviceId: string, tripId: string, stepId: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createStepDocId(deviceId, tripId, stepId);
    const existingDoc = await db.get<StepDocument>(documentId);
    
    await db.remove(existingDoc);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Step with ID ${stepId} not found`);
    }
    console.error('Error deleting step:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Get all steps for a specific device and trip
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @returns Promise<Step[]> - Array of steps
 */
export async function getSteps(deviceId: string, tripId: string): Promise<Step[]> {
  const db = getDatabase();
  
  try {
    // Query all step documents for this device + trip
    const result = await db.allDocs<StepDocument>({
      include_docs: true,
      startkey: `${deviceId}>${tripId}>step>`,
      endkey: `${deviceId}>${tripId}>step>\ufff0`
    });
    
    return result.rows
      .filter(row => row.doc && row.doc.type === 'step')
      .map(row => {
        const doc = row.doc!;
        return {
          id: doc.step_id,
          type: doc.data.type,
          startDate: doc.data.startDate,
          finishDate: doc.data.finishDate,
          startTimestamp: doc.data.startTimestamp,
          finishTimestamp: doc.data.finishTimestamp,
          startLocationId: doc.data.startLocationId,
          finishLocationId: doc.data.finishLocationId,
          startAirport: doc.data.startAirport,
          finishAirport: doc.data.finishAirport,
          description: doc.data.description
        } as Step;
      });
  } catch (error: any) {
    console.error('Error getting steps:', error);
    handleDatabaseError(error);
    throw error;
  }
}

// TRIP OPERATIONS

/**
 * Create a new trip document in PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param title - Trip title
 * @param subtitle - Trip subtitle
 * @returns Promise<boolean> - Success status
 */
export async function createTrip(deviceId: string, tripId: string, title: string = 'My Trip', subtitle: string = ''): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const timestamp = Date.now();
    
    const tripDocument: TripDocument = {
      _id: createTripDocId(deviceId, tripId),
      type: 'trip',
      device_id: deviceId,
      trip_id: tripId,
      data: {
        created_at: timestamp,
        updated_at: timestamp,
        title,
        subtitle
      }
    };
    
    await db.put(tripDocument);
    return true;
  } catch (error: any) {
    console.error('Error creating trip:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Update trip metadata in PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param data - Partial trip data to update
 * @returns Promise<boolean> - Success status
 */
export async function updateTrip(deviceId: string, tripId: string, data: Partial<Pick<Trip, 'title' | 'subtitle'>>): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createTripDocId(deviceId, tripId);
    const existingDoc = await db.get<TripDocument>(documentId);
    
    const updatedDocument: TripDocument = {
      ...existingDoc,
      data: {
        ...existingDoc.data,
        ...data,
        updated_at: Date.now()
      }
    };
    
    await db.put(updatedDocument);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Trip with ID ${tripId} not found`);
    }
    console.error('Error updating trip:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Soft-delete a trip by setting deleted_at timestamp
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @returns Promise<boolean> - Success status
 */
export async function deleteTrip(deviceId: string, tripId: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const documentId = createTripDocId(deviceId, tripId);
    const existingDoc = await db.get<TripDocument>(documentId);
    
    const updatedDocument: TripDocument = {
      ...existingDoc,
      data: {
        ...existingDoc.data,
        deleted_at: Date.now(),
        updated_at: Date.now()
      }
    };
    
    await db.put(updatedDocument);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new DocumentNotFoundError(`Trip with ID ${tripId} not found`);
    }
    console.error('Error deleting trip:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Get trip document from PouchDB
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @returns Promise<Trip | null> - Trip data or null if not found
 */
export async function getTrip(deviceId: string, tripId: string): Promise<Trip | null> {
  const db = getDatabase();
  
  try {
    const documentId = createTripDocId(deviceId, tripId);
    const doc = await db.get<TripDocument>(documentId);
    
    if (doc.type !== 'trip') {
      return null;
    }
    
    // Don't return deleted trips unless specifically requested
    if (doc.data.deleted_at) {
      return null;
    }
    
    return doc.data;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error('Error getting trip:', error);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Load all trip data (trip info, locations, steps) for a specific device and trip
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @returns Promise with trip info, locations, and steps
 */
export async function loadTripData(deviceId: string, tripId: string): Promise<{ 
  trip: Trip | null; 
  locations: Location[]; 
  steps: Step[] 
}> {
  try {
    // Load all data in parallel
    const [trip, locations, steps] = await Promise.all([
      getTrip(deviceId, tripId),
      getLocations(deviceId, tripId),
      getSteps(deviceId, tripId)
    ]);
    
    return { trip, locations, steps };
  } catch (error: any) {
    console.error('Error loading trip data:', error);
    handleDatabaseError(error);
    throw error;
  }
}

// LOCATION REFERENCE UTILITIES FOR STEPS

/**
 * Convert location UUIDs in steps to location objects for app use
 * This resolves step location references to actual location data
 * @param steps - Array of steps with location UUIDs
 * @param locations - Map of available locations
 * @returns Steps with resolved location references (for compatibility only - steps still store UUIDs)
 */
export function resolveLocationReferences(steps: Step[], locations: Record<string, Location>): Step[] {
  // Note: This function is for future compatibility if we need to embed location objects
  // Currently steps store location UUIDs and resolve them in the UI layer
  return steps;
}

/**
 * Convert location objects in steps to location UUIDs for storage
 * This ensures steps only store location UUIDs, not full objects
 * @param steps - Array of steps that might have location objects
 * @returns Steps with only location UUIDs
 */
export function createLocationReferences(steps: Step[]): Step[] {
  // Note: This function is for future compatibility if we receive steps with embedded objects
  // Currently our Step interface already uses UUIDs, so this is a pass-through
  return steps;
}

/**
 * Get full location document IDs for a step (for querying locations)
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param step - Step with location UUIDs
 * @returns Array of full location document IDs
 */
export function getLocationDocIdsFromStep(deviceId: string, tripId: string, step: Step): string[] {
  const locationIds = [step.startLocationId];
  if (step.finishLocationId) {
    locationIds.push(step.finishLocationId);
  }
  return locationIds.map(locId => createLocationDocId(deviceId, tripId, locId));
}

/**
 * Validate that all location references in a step exist
 * @param deviceId - Device UUID
 * @param tripId - Trip UUID
 * @param step - Step to validate
 * @returns Promise<boolean> - True if all references are valid
 */
export async function validateStepLocationReferences(deviceId: string, tripId: string, step: Step): Promise<boolean> {
  try {
    const startLocationDocId = createLocationDocId(deviceId, tripId, step.startLocationId);
    const startLocation = await getLocationByDocumentId(startLocationDocId);
    
    if (!startLocation) {
      return false;
    }
    
    if (step.finishLocationId) {
      const finishLocationDocId = createLocationDocId(deviceId, tripId, step.finishLocationId);
      const finishLocation = await getLocationByDocumentId(finishLocationDocId);
      
      if (!finishLocation) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating step location references:', error);
    return false;
  }
}

// Error handling for database operations
export function handleDatabaseError(error: any): void {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage quota exceeded. Please free up space or clear old data.');
  } else if (error.status === 404) {
    console.error('Document not found:', error);
  } else if (error.status === 409) {
    console.error('Document conflict (concurrent update):', error);
  } else {
    console.error('Database error:', error);
  }
}

// Database error types for better error handling
export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export class DocumentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentNotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

// Cleanup function for testing or when database is no longer needed
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.close();
      dbInstance = null;
      console.log('Database closed successfully');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
} 