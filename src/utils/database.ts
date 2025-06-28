import PouchDB from 'pouchdb';
import type { Location, LocationDocument, DatabaseDocument } from '../types';
import { createLocationDocId, parseDocumentId } from './documentIds';
import { generateLocationId } from './ids';

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