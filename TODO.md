# TODO: Migrate from localStorage to PouchDB

## Overview
Migrate timeline data storage from localStorage to PouchDB while keeping device ID and zoom level in localStorage.

## Phase 1: Setup and Infrastructure

### 1.1 Dependencies and Configuration
- [x] Install PouchDB dependency (`npm install pouchdb @types/pouchdb`)
- [x] Install PouchDB plugins if needed (e.g., for indexing)
- [x] Create PouchDB database configuration
- [x] Set up database instance with appropriate name (e.g., "timeline-data")

### 1.2 Database Setup
- [x] Create database initialization function
- [x] Set up error handling for database operations
- [x] Configure database indexes for efficient querying

## Phase 2: ID Generation and Device Management

### 2.1 Device ID Generation
- [x] Create utility function to generate unique device ID using `crypto.randomUUID()`
- [x] Check localStorage for existing device ID (`"tavel-timeline-device-id"`)
- [x] Generate and store new device ID if none exists
- [x] Ensure device ID format is suitable for PouchDB document IDs

### 2.2 Trip ID Generation
- [x] Create utility function to generate unique trip ID using `crypto.randomUUID()`
- [x] Implement trip ID generation when "New travel" button is clicked
- [x] Store current trip ID in app state for session use

## Phase 3: Data Structure Migration

### 3.1 Update Type Definitions
- [x] Add Trip interface with required fields:
  - `created_at: timestamp`
  - `updated_at: timestamp` 
  - `deleted_at: timestamp`
  - `title: string`
  - `subtitle: string`
- [x] Update existing Location and Step interfaces if needed for PouchDB compatibility
- [x] Add PouchDB document metadata types (`_id`, `_rev`)
- [x] Update Location interface to use string ID instead of numeric ID
- [x] Remove redundant id fields from document data objects

### 3.2 Create Document ID Utilities
- [x] Create function to generate location document ID: `"${device_id}>${trip_id}>location>${location_id}"`
- [x] Create function to generate step document ID: `"${device_id}>${trip_id}>step>${step_id}"`
- [x] Create function to generate trip info document ID: `"${device_id}>${trip_id}>trip"`
- [x] Create function to parse document IDs back to component parts (handle new ">" separator format)
- [x] Create function to generate location IDs using `crypto.randomUUID()`
- [x] Create function to generate step IDs using `crypto.randomUUID()`
- [x] Create utilities to convert location IDs to PouchDB document ID references
- [x] Create utilities to extract location IDs from PouchDB document ID references

## Phase 4: Database Operations

### 4.1 Location Operations
- [x] Replace `addLocation` to store in PouchDB with proper document ID
- [x] Replace `updateLocation` to update PouchDB document
- [x] Replace `deleteLocation` to remove from PouchDB
- [x] Update location loading to fetch from PouchDB
- [x] Update location ID generation to use `crypto.randomUUID()` exclusively
- [x] Update location queries to use new document ID format with ">" separators

### 4.2 Step Operations  
- [ ] Replace `addStep` to store in PouchDB with proper document ID
- [ ] Replace `updateStep` to update PouchDB document
- [ ] Replace `deleteStep` to remove from PouchDB
- [ ] Update step loading to fetch from PouchDB
- [ ] Update step ID generation to use `crypto.randomUUID()` exclusively
- [ ] Update step creation to store only location UUIDs (not full document IDs)
- [ ] Update step queries to use new document ID format with ">" separators
- [ ] Create utilities to build full location document IDs from step context
- [ ] Create utilities to convert between location objects (for app use) and location UUIDs (for storage)

### 4.3 Trip Operations (New)
- [ ] Create `createTrip` function to initialize new trip info document
- [ ] Create `updateTrip` function to modify trip metadata
- [ ] Create `deleteTrip` function to soft-delete trip (set `deleted_at`)
- [ ] Create trip loading function

## Phase 5: App State Management Updates

### 5.1 Update useAppState Composable
- [ ] Remove localStorage usage for locations and steps
- [ ] Add PouchDB operations for data persistence
- [ ] Add trip state management
- [ ] Maintain reactivity with Vue's reactive system
- [ ] Add loading states for async database operations
- [ ] Update location ID handling to use string IDs instead of numeric IDs
- [ ] Implement location reference resolution (convert location UUIDs to location objects for app compatibility)
- [ ] Add utilities to build full location document IDs when needed for querying
- [ ] Add reference validation when creating/updating steps

### 5.2 Error Handling
- [ ] Add database connection error handling
- [ ] Add document conflict resolution
- [ ] Add offline/online state handling
- [ ] Update error messages for database-specific errors

## Phase 6: Migration and Reset Functionality

### 6.1 Update Reset Button
- [ ] Modify "New travel" functionality to:
  - Generate new trip ID
  - Create new trip info document
  - Clear current locations and steps from state
  - Keep device ID and zoom level in localStorage
- [ ] Ensure old trip data remains in PouchDB (no deletion)

### 6.2 Data Migration (Future Enhancement)
- [ ] Create migration utility to import existing localStorage data (optional)
- [ ] Add export functionality for trip data
- [ ] Add import functionality for trip data

## Phase 7: Query and Loading Optimization

### 7.1 Efficient Data Loading
- [ ] Implement trip-specific data loading (filter by device_id + trip_id)
- [ ] Update query patterns to use new document ID format with ">" separators
- [ ] Add indexes for faster querying
- [ ] Implement incremental loading if needed
- [ ] Cache frequently accessed data in memory

### 7.2 Sync Considerations
- [ ] Plan for future multi-device sync capabilities
- [ ] Design conflict resolution strategy
- [ ] Consider offline-first approach

## Phase 8: Testing and Validation

### 8.1 Unit Tests
- [ ] Test ID generation functions (device, trip, location, step) with `crypto.randomUUID()`
- [ ] Test document ID utilities with new ">" separator format
- [ ] Test document CRUD operations
- [ ] Test trip management functions
- [ ] Test location reference conversion utilities
- [ ] Test document ID parsing with new format
- [ ] Test error scenarios

### 8.2 Integration Tests
- [ ] Test complete workflow: create trip → add locations → add steps
- [ ] Test reset functionality
- [ ] Test data persistence across browser sessions
- [ ] Test error recovery
- [ ] Test location reference integrity (steps reference valid location UUIDs)
- [ ] Test location document ID reconstruction from step context
- [ ] Test location deletion prevention when referenced by steps

### 8.3 User Testing
- [ ] Test with real travel data
- [ ] Verify timeline display works correctly
- [ ] Ensure all existing features still work
- [ ] Performance testing with larger datasets

## Phase 9: Cleanup and Documentation

### 9.1 Code Cleanup
- [ ] Remove localStorage references for timeline data
- [ ] Clean up unused imports and utilities
- [ ] Add proper TypeScript types
- [ ] Update error messages

### 9.2 Documentation
- [ ] Update README.md with new data structure
- [ ] Document PouchDB setup requirements
- [ ] Add migration notes for existing users
- [ ] Update development setup instructions

## Notes
- **No existing data migration**: Current localStorage data will not be automatically migrated
- **Backwards compatibility**: Not maintained - fresh start with PouchDB
- **Device isolation**: Each device maintains separate timeline data
- **Trip isolation**: Each travel/trip maintains separate data scope 