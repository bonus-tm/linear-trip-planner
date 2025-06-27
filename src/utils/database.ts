import PouchDB from 'pouchdb';

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