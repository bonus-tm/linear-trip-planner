# Technical Specifications: PouchDB Migration

## Database Configuration

### Database Instance
- **Database Name**: `"timeline-data"`
- **Storage**: Browser IndexedDB via PouchDB
- **Adapter**: Default PouchDB adapter (idb for browsers)

### Connection Configuration
```typescript
const db = new PouchDB('timeline-data', {
  auto_compaction: true,
  revs_limit: 10
});
```

## Data Storage Strategy

### localStorage Retention
Only these items remain in localStorage:
- **Key**: `"travel-timeline-zoom"` → **Value**: ZoomLevel ('fit' | number)  
- **Key**: `"travel-timeline-device-id"` → **Value**: string (generated UUID)
- **Key**: `"travel-timeline-trip-id"` → **Value**: string (generated UUID)

### Type System Migration
Application types have been updated for PouchDB compatibility:
- **Location.id**: Changed from `number` to `string` (UUID)
- **Step.startLocationId**: Changed from `number` to `string` (UUID)
- **Step.finishLocationId**: Changed from `number?` to `string?` (UUID)
- **LocationsMap**: Changed from `Record<number, Location>` to `Record<string, Location>`

New PouchDB document types added:
- **LocationDocument**: PouchDB document schema for locations
- **StepDocument**: PouchDB document schema for steps  
- **TripDocument**: PouchDB document schema for trip metadata
- **DatabaseDocument**: Union type for all document types

### PouchDB Document Structure

#### Device ID Format
- **Generation**: `crypto.randomUUID()` exclusively
- **Storage**: localStorage with key `"travel-timeline-device-id"`
- **Format**: Standard UUID (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")

#### Trip ID Format  
- **Generation**: `crypto.randomUUID()` exclusively
- **Scope**: Per travel/timeline session
- **Usage**: Combined with device_id for document namespacing

#### Location ID Format
- **Generation**: `crypto.randomUUID()` exclusively
- **Scope**: Per location within a trip
- **Usage**: Combined with device_id and trip_id for location document IDs

#### Step ID Format
- **Generation**: `crypto.randomUUID()` exclusively
- **Scope**: Per step within a trip
- **Usage**: Combined with device_id and trip_id for step document IDs

## Document Schema Specifications

### Location Documents
```typescript
interface LocationDocument {
  _id: string; // Format: "${device_id}>${trip_id}>location>${location_id}"
  _rev?: string; // PouchDB revision
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
```

**Example Document ID**: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890>f1e2d3c4-b5a6-9870-dcba-fe0987654321>location>9876543a-bcde-f012-3456-789abcdef012"`

### Step Documents
```typescript
interface StepDocument {
  _id: string; // Format: "${device_id}>${trip_id}>step>${step_id}"
  _rev?: string; // PouchDB revision
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
```

**Example Document ID**: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890>f1e2d3c4-b5a6-9870-dcba-fe0987654321>step>1234567b-cdef-0123-4567-89abcdef0123"`

**Example Step with Location References**:
```json
{
  "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890>f1e2d3c4-b5a6-9870-dcba-fe0987654321>step>1234567b-cdef-0123-4567-89abcdef0123",
  "type": "step",
  "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trip_id": "f1e2d3c4-b5a6-9870-dcba-fe0987654321",
  "step_id": "1234567b-cdef-0123-4567-89abcdef0123",
  "stepType": "move",
  "startLocationId": "9876543a-bcde-f012-3456-789abcdef012",
  "finishLocationId": "fedcba98-7654-3210-fedc-ba9876543210",
  "startDate": "2024-01-15T10:00:00.000Z",
  "finishDate": "2024-01-15T14:30:00.000Z",
  "startTimestamp": 1705311600000,
  "finishTimestamp": 1705327800000,
  "created_at": 1699123456789,
  "updated_at": 1699123456789
}
```

**Note**: To get the full location document ID, combine: `${step.device_id}>${step.trip_id}>location>${step.startLocationId}`

### Trip Info Documents (New)
```typescript
interface TripDocument {
  _id: string; // Format: "${device_id}>${trip_id}>trip"
  _rev?: string; // PouchDB revision
  type: 'trip';
  device_id: string; // UUID
  trip_id: string; // UUID
  created_at: number; // timestamp
  updated_at: number; // timestamp  
  deleted_at?: number; // timestamp, optional (soft delete)
  places: string[]; // Array of location names
  month: number[][]; // Array of [year, month] arrays for trip date range
  duration: number; // duration of trip in days
}
```

**Example Document ID**: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890>f1e2d3c4-b5a6-9870-dcba-fe0987654321>trip"`

## Query Patterns

### Load All Trip Data
```typescript
// Get all documents for current device + trip
const result = await db.allDocs({
  include_docs: true,
  startkey: `${device_id}>${trip_id}>`,
  endkey: `${device_id}>${trip_id}>\ufff0`
});
```

### Load Specific Data Type
```typescript
// Get only locations for current trip
const result = await db.allDocs({
  include_docs: true, 
  startkey: `${device_id}>${trip_id}>location>`,
  endkey: `${device_id}>${trip_id}>location>\ufff0`
});

// Get only steps for current trip
const stepsResult = await db.allDocs({
  include_docs: true,
  startkey: `${device_id}>${trip_id}>step>`,
  endkey: `${device_id}>${trip_id}>step>\ufff0`
});

// Get trip info
const tripResult = await db.get(`${device_id}>${trip_id}>trip`);
```

### Indexes for Performance
```typescript
// Create indexes for faster queries
await db.createIndex({
  index: {
    fields: ['type', 'device_id', 'trip_id', 'created_at']
  }
});
```

## ID Generation Utilities

### Utility File Organization
ID generation and document management is split across utility files:
- **`src/utils/ids.ts`**: Core ID generation functions (device, trip, location, step)
- **`src/utils/documentIds.ts`**: Document ID creation, parsing, and reference management
- **`src/utils/database.ts`**: Database configuration and connection management

### Device ID Management
```typescript
// Located in src/utils/ids.ts
function getOrCreateDeviceId(): string {
  const storageKey = 'travel-timeline-device-id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}
```

### Location Reference Utilities
```typescript
// Convert location ID to full PouchDB document ID reference
function getLocationDocumentId(deviceId: string, tripId: string, locationId: string): string {
  return createLocationDocId(deviceId, tripId, locationId);
}

// Build location document ID from step document context
function buildLocationDocIdFromStep(stepDocument: StepDocument, locationId: string): string {
  return `${stepDocument.device_id}>${stepDocument.trip_id}>location>${locationId}`;
}

// Extract location ID from full PouchDB document ID reference  
function getLocationIdFromReference(locationDocId: string): string | null {
  const parsed = parseDocumentId(locationDocId);
  if (parsed?.type === 'location') {
    return parsed.entityId || null;
  }
  return null;
}

// Get location document IDs for a step (for querying locations)
function getStepLocationDocIds(stepDocument: StepDocument): string[] {
  const locationIds = [stepDocument.startLocationId];
  if (stepDocument.finishLocationId) {
    locationIds.push(stepDocument.finishLocationId);
  }
  return locationIds.map(locId => buildLocationDocIdFromStep(stepDocument, locId));
}
```

### Trip ID Generation
```typescript
function generateTripId(): string {
  return crypto.randomUUID();
}
```

### Location ID Generation
```typescript
function generateLocationId(): string {
  return crypto.randomUUID();
}
```

### Step ID Generation
```typescript
function generateStepId(): string {
  return crypto.randomUUID();
}
```

### App State Integration
Trip and device IDs are managed in the app state composable:
```typescript
// Located in src/composables/useAppState.ts
const currentTripId = ref<string | null>(null);
const deviceId = ref<string>(getOrCreateDeviceId());
const currentTrip = ref<Trip | null>(null);
const allTrips = ref<Array<Trip & { id: string }>>([]);

// Auto-computed trip metadata (reactive)
const tripPlaces = ref<string[]>([]);
const tripMonth = ref<number[][]>([]);
const tripDuration = ref(0);

// Functions for trip management
const createNewTrip = async (): Promise<string> => {
  const newTripId = generateTripId();
  await dbCreateTrip(deviceId.value, newTripId);
  currentTripId.value = newTripId;
  localStorage.setItem('travel-timeline-trip-id', newTripId);
  locations.value = {};
  steps.value = [];
  await loadTripData();
  await loadAllTrips();
  return newTripId;
};

const switchToTrip = async (tripId: string): Promise<void> => {
  currentTripId.value = tripId;
  localStorage.setItem('travel-timeline-trip-id', tripId);
  await loadTripData();
};

const loadAllTrips = async (): Promise<void> => {
  const trips = await dbGetAllTrips(deviceId.value);
  allTrips.value = trips;
};
```

### Document ID Utilities
```typescript
// Located in src/utils/documentIds.ts
function createLocationDocId(deviceId: string, tripId: string, locationId: string): string {
  return `${deviceId}>${tripId}>location>${locationId}`;
}

function createStepDocId(deviceId: string, tripId: string, stepId: string): string {
  return `${deviceId}>${tripId}>step>${stepId}`;
}

function createTripDocId(deviceId: string, tripId: string): string {
  return `${deviceId}>${tripId}>trip`;
}

function parseDocumentId(docId: string): { deviceId: string; tripId: string; type: string; entityId?: string } | null {
  const parts = docId.split('>');
  if (parts.length < 3) return null;
  
  const [deviceId, tripId, type, entityId] = parts;
  
  if (!deviceId || !tripId || !type) return null;
  
  return { 
    deviceId, 
    tripId, 
    type, // 'location', 'step', or 'trip'
    entityId // UUID for location/step, undefined for trip
  };
}
```

## Database Operations Interface

### Core Operations
```typescript
interface DatabaseOperations {
  // Location operations
  addLocation(deviceId: string, tripId: string, location: Omit<Location, 'id'>): Promise<Location>;
  updateLocation(deviceId: string, tripId: string, locationId: string, data: Partial<Location>): Promise<boolean>;
  deleteLocation(deviceId: string, tripId: string, locationId: string): Promise<boolean>;
  getLocations(deviceId: string, tripId: string): Promise<Location[]>;
  getLocationByDocumentId(locationDocId: string): Promise<Location | null>;
  
  // Step operations (updated to handle location references)
  addStep(deviceId: string, tripId: string, step: Omit<Step, 'id'>): Promise<Step>;
  updateStep(deviceId: string, tripId: string, stepId: string, data: Partial<Step>): Promise<boolean>;
  deleteStep(deviceId: string, tripId: string, stepId: string): Promise<boolean>;
  getSteps(deviceId: string, tripId: string): Promise<Step[]>;
  
  // Trip operations
  createTrip(deviceId: string, tripId: string, places: string[], month: number[][], duration: number): Promise<boolean>;
  updateTrip(deviceId: string, tripId: string, data: Partial<Pick<Trip, 'places' | 'month' | 'duration'>>): Promise<boolean>;
  deleteTrip(deviceId: string, tripId: string): Promise<boolean>; // Soft delete
  deleteEntireTrip(deviceId: string, tripId: string): Promise<boolean>; // Hard delete - removes all trip data
  getTrip(deviceId: string, tripId: string): Promise<Trip | null>;
  getAllTrips(deviceId: string): Promise<Array<Trip & { id: string }>>;
  
  // Batch operations
  loadTripData(deviceId: string, tripId: string): Promise<{ trip: Trip | null; locations: Location[]; steps: Step[] }>;
  
  // Reference utilities  
  resolveLocationReferences(steps: Step[], locations: Location[]): Step[]; // Convert location UUIDs to location objects for app use
  createLocationReferences(steps: Step[]): Step[]; // Convert location objects to location UUIDs for storage
  getLocationDocIdsFromStep(deviceId: string, tripId: string, step: Step): string[]; // Get full location document IDs for a step
  validateStepLocationReferences(deviceId: string, tripId: string, step: Step): Promise<boolean>; // Validate step location references
}
```

## Location Operations Implementation

### Implementation Status
✅ **Phase 4.1 Location Operations - COMPLETED**
- **addLocation**: Implemented with PouchDB storage using proper document ID format
- **updateLocation**: Implemented with PouchDB document updates
- **deleteLocation**: Implemented with PouchDB document removal
- **getLocations**: Implemented with PouchDB queries using document ID ranges
- **getLocationByDocumentId**: Implemented for direct document access
- **ID Generation**: All location IDs now use `crypto.randomUUID()` exclusively
- **Query Patterns**: All location queries use new ">" separator format

### Async Operation Handling
All location operations are now asynchronous and return Promises:
```typescript
// Examples of updated function signatures
const addLocation = async (locationData: Omit<Location, 'id'>): Promise<boolean>
const updateLocation = async (locationId: string, updatedLocation: Omit<Location, 'id'>): Promise<boolean>
const deleteLocation = async (locationId: string): Promise<boolean>
const loadLocations = async (): Promise<void>
```

### Loading States and Error Handling
- **Loading Indicators**: All UI components now show loading states during async operations
- **Error Management**: Comprehensive error handling with user-friendly messages
- **Reactive Updates**: Location state is automatically updated after successful operations
- **Validation**: Location name uniqueness and step reference validation maintained

### Document Storage Format
Locations are stored as PouchDB documents with the following structure:
```json
{
  "_id": "device-uuid>trip-uuid>location>location-uuid",
  "type": "location",
  "device_id": "device-uuid",
  "trip_id": "trip-uuid", 
  "location_id": "location-uuid",
  "name": "Location Name",
  "coordinates": { "lat": 51.5074, "lng": -0.1278 },
  "timezone": 0,
  "created_at": 1699123456789,
  "updated_at": 1699123456789
}
```

### UI Integration
- **LocationsTable**: Updated to handle async operations with loading states
- **LocationSelect**: Updated to handle async location creation
- **LocationEditModal**: Compatible with new async flow
- **ResetButton**: Updated to handle async trip creation

## Step Operations Implementation

### Implementation Status
✅ **Phase 4.2 Step Operations - COMPLETED**
- **addStep**: Implemented with PouchDB storage using proper document ID format
- **updateStep**: Implemented with PouchDB document updates  
- **deleteStep**: Implemented with PouchDB document removal
- **getSteps**: Implemented with PouchDB queries using document ID ranges
- **loadSteps**: Implemented for loading all steps for a trip
- **ID Generation**: All step IDs now use `crypto.randomUUID()` exclusively
- **Query Patterns**: All step queries use new ">" separator format
- **Location References**: Steps store only location UUIDs (not full document IDs)

### Async Operation Handling
All step operations are now asynchronous and return Promises:
```typescript
// Examples of updated function signatures
const addStep = async (step: Omit<Step, 'id'>): Promise<boolean>
const updateStep = async (stepId: string, updatedStep: Partial<Omit<Step, 'id'>>): Promise<boolean>
const deleteStep = async (stepId: string): Promise<boolean>
const loadSteps = async (): Promise<void>
```

### Location Reference Management
Steps store location references as UUIDs and validate them during operations:
```typescript
// Location reference validation
const validateStepLocationReferences = async (deviceId: string, tripId: string, step: Step): Promise<boolean>

// Get full location document IDs for querying
const getLocationDocIdsFromStep = (deviceId: string, tripId: string, step: Step): string[]

// Reference utilities for future compatibility
const resolveLocationReferences = (steps: Step[], locations: Record<string, Location>): Step[]
const createLocationReferences = (steps: Step[]): Step[]
```

### Document Storage Format
Steps are stored as PouchDB documents with the following structure:
```json
{
  "_id": "device-uuid>trip-uuid>step>step-uuid",
  "type": "step",
  "device_id": "device-uuid",
  "trip_id": "trip-uuid",
  "step_id": "step-uuid",
  "stepType": "move",
  "startDate": "2024-01-15T10:00:00.000Z",
  "finishDate": "2024-01-15T14:30:00.000Z",
  "startTimestamp": 1705311600000,
  "finishTimestamp": 1705327800000,
  "startLocationId": "location-uuid-only",
  "finishLocationId": "location-uuid-only",
  "startAirport": "JFK",
  "finishAirport": "LHR",
  "description": "Flight to London",
  "created_at": 1699123456789,
  "updated_at": 1699123456789
}
```

### Location Reference Validation
- **Creation Validation**: All location references validated before step creation
- **Update Validation**: Location references validated when updating step locations
- **Reference Integrity**: Prevents creation of steps with non-existent location references
- **Automatic Resolution**: UI components automatically resolve location UUIDs to location objects for display

### Loading States and Error Handling
- **Loading Indicators**: All UI components show loading states during async operations
- **Error Management**: Comprehensive error handling with user-friendly messages
- **Reactive Updates**: Step state automatically updated after successful operations
- **Validation**: Location reference validation and business rule enforcement

### UI Integration
- **StepsTable**: Updated to handle async operations with loading states
- **MoveEditModal**: Compatible with new async flow and reference validation
- **StayEditModal**: Compatible with new async flow and reference validation
- **Step Cards**: Automatically resolve location references for display

### Data Migration Notes
- **localStorage Removal**: Steps no longer stored in localStorage
- **Fresh Start**: Users start with empty step data when using PouchDB
- **UUID Consistency**: All step and location IDs use consistent UUID format
- **Reference Integrity**: Maintains referential integrity between steps and locations

## Trip Operations Implementation

### Implementation Status
✅ **Phase 4.3 Trip Operations - COMPLETED**
- **createTrip**: Implemented with PouchDB storage using proper document ID format
- **updateTrip**: Implemented with PouchDB document updates for trip metadata
- **deleteTrip**: Implemented with PouchDB soft-delete (sets `deleted_at` timestamp)
- **getTrip**: Implemented with PouchDB queries for trip document retrieval
- **loadTripData**: Implemented for loading complete trip data (trip info, locations, steps)
- **ID Generation**: All trip IDs use `crypto.randomUUID()` exclusively
- **Query Patterns**: All trip queries use new ">" separator format

✅ **Phase 4.5 Complete Trip Deletion - COMPLETED**
- **deleteEntireTrip**: Implemented with complete removal of all trip-related data
- **TripDeleteButton**: New UI component with confirmation dialog and danger zone design
- **Bulk Operations**: Efficient deletion using PouchDB bulk operations
- **Auto Navigation**: Automatic switching to first available trip after deletion

### Async Operation Handling
All trip operations are now asynchronous and return Promises:
```typescript
// Examples of updated function signatures
const createNewTrip = async (title?: string, subtitle?: string): Promise<string>
const updateTripInfo = async (data: Partial<Pick<Trip, 'title' | 'subtitle'>>): Promise<boolean>
const deleteTripInfo = async (): Promise<boolean> // Soft delete
const deleteEntireTrip = async (): Promise<boolean> // Hard delete
const loadTripData = async (): Promise<void>
```

### Trip State Management
Trip information is now managed as reactive state in the app:
```typescript
// New trip state in useAppState
const currentTrip = ref<Trip | null>(null);
const currentTripId = ref<string | null>(null);

// Trip operations available
const createNewTrip = async (title: string = 'My Trip', subtitle: string = ''): Promise<string>
const updateTripInfo = async (data: Partial<Pick<Trip, 'title' | 'subtitle'>>): Promise<boolean>
const deleteTripInfo = async (): Promise<boolean> // Soft delete
const deleteEntireTrip = async (): Promise<boolean> // Hard delete with complete data removal
```

### Document Storage Format
Trips are stored as PouchDB documents with the following structure:
```json
{
  "_id": "device-uuid>trip-uuid>trip",
  "type": "trip",
  "device_id": "device-uuid",
  "trip_id": "trip-uuid",
  "created_at": 1699123456789,
  "updated_at": 1699123456789,
  "places": ["Paris", "London", "Tokyo"],
  "month": [[2024, 7], [2024, 7]],
  "duration": 14
}
```

### Soft Delete Implementation
Trip deletion is implemented as a soft delete, preserving trip data:
```json
{
  "_id": "device-uuid>trip-uuid>trip",
  "type": "trip", 
  "device_id": "device-uuid",
  "trip_id": "trip-uuid",
  "created_at": 1699123456789,
  "updated_at": 1699234567890,
  "deleted_at": 1699234567890,
  "places": ["Deleted Trip"],
  "month": [],
  "duration": 0
}
```

### Hard Delete Implementation
✅ **Phase 4.5 Complete Trip Deletion - COMPLETED**
- **deleteEntireTrip**: Implemented with complete removal of all trip-related data
- **Bulk Operations**: Uses PouchDB bulk delete for efficient removal of multiple documents
- **Complete Data Removal**: Deletes trip document, all locations, and all steps permanently
- **UI Integration**: Integrated with TripDeleteButton component for user-initiated deletion

The `deleteEntireTrip` function performs a complete hard delete:
```typescript
export async function deleteEntireTrip(deviceId: string, tripId: string): Promise<boolean> {
  const db = getDatabase();

  try {
    // Get all documents for this trip (locations, steps, and trip document)
    const result = await db.allDocs({
      include_docs: true,
      startkey: `${deviceId}>${tripId}>`,
      endkey: `${deviceId}>${tripId}>\ufff0`,
    });

    // Prepare batch delete for all documents
    const docsToDelete = result.rows
      .filter(row => row.doc)
      .map(row => ({
        ...row.doc,
        _deleted: true, // Mark for deletion
      }));

    if (docsToDelete.length > 0) {
      // Perform bulk delete operation
      await db.bulkDocs(docsToDelete);
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting entire trip:', error);
    handleDatabaseError(error);
    throw error;
  }
}
```

### TripDeleteButton Component
✅ **New UI Component - COMPLETED**
- **Location**: `src/components/TripDeleteButton.vue`
- **Placement**: Below LocationsTable in main app layout
- **Confirmation**: Uses PrimeVue ConfirmDialog for user confirmation
- **Trip Switching**: Automatically switches to first available trip after deletion
- **Design**: Danger zone styling with clear warning messages

**Component Features**:
- **Confirmation Dialog**: Shows trip name and clear deletion warning
- **Complete Deletion**: Uses `deleteEntireTrip` for permanent data removal
- **Auto Navigation**: Switches to first available trip automatically after deletion
- **Error Handling**: Comprehensive error management with user feedback
- **Loading States**: Shows loading indicators during deletion process
- **Responsive Design**: Mobile-friendly danger zone layout

**Integration Points**:
- **App.vue**: Added TripDeleteButton component below LocationsTable
- **ConfirmDialog**: Added PrimeVue ConfirmDialog to App.vue for confirmation functionality
- **useAppState**: Exposed `deleteEntireTrip` function for component use

### New Trip Creation Workflow
The enhanced "New travel" functionality now:
1. **Generates new trip ID**: Uses `crypto.randomUUID()` for unique identification
2. **Creates trip document**: Stores trip metadata in PouchDB with empty places/month/duration fields
3. **Clears app state**: Resets locations and steps to empty state for new trip
4. **Preserves old data**: Previous trip data remains in PouchDB (no deletion)
5. **Loads new trip**: Initializes app state with new trip data (empty initially)
6. **Auto-updates fields**: Places, month, and duration are automatically populated as steps and locations are added

### Batch Data Loading
Implemented efficient parallel loading of all trip-related data:
```typescript
// Loads trip info, locations, and steps in parallel
const loadTripData = async (): Promise<{
  trip: Trip | null;
  locations: Location[];
  steps: Step[];
}>
```

### Loading States and Error Handling
- **Loading Indicators**: All UI components show loading states during async trip operations
- **Error Management**: Comprehensive error handling with user-friendly messages
- **Reactive Updates**: Trip state automatically updated after successful operations
- **Validation**: Trip data validation and business rule enforcement

### UI Integration
- **ResetButton**: Updated to create actual trip documents in PouchDB
- **TripDeleteButton**: New component for complete trip deletion with confirmation dialog
- **App State**: Trip information available throughout application via reactive state
- **Trip Context**: All location and step operations now work within trip context
- **Async Compatibility**: All trip operations compatible with existing async operation patterns
- **ConfirmDialog**: PrimeVue confirmation service integrated for trip deletion confirmations

### Multiple Trip Management
✅ **Phase 4.4 Multiple Trip Support - COMPLETED**
- **getAllTrips**: Implemented to load all trips for a device with proper sorting
- **switchToTrip**: Implemented to switch between existing trips
- **Trip List State**: `allTrips` reactive state maintains list of all available trips
- **Trip Persistence**: Current trip ID persisted in localStorage for session continuity

### Trip Sorting Algorithm
The `getAllTrips` function returns trips sorted by:
1. **Primary**: Trip start year (most recent first)
2. **Secondary**: Trip start month within same year (most recent first)  
3. **Tertiary**: `updated_at` timestamp (most recent first)

```typescript
.sort((a, b) => {
  const byYear = (b.month[0]?.[0] ?? 0) - (a.month[0]?.[0] ?? 0);
  const byMonth = (b.month[0]?.[1] ?? 0) - (a.month[0]?.[1] ?? 0);
  if (byYear !== 0) {
    return byYear;
  } else if (byMonth !== 0) {
    return byMonth;
  } else {
    return b.updated_at - a.updated_at;
  }
});
```

### Automatic Trip Metadata Computation
Trip metadata is automatically computed and updated whenever steps change:
```typescript
// Reactive watchEffect automatically computes:
tripPlaces.value = Array.from(uniqueLocationNames); // All locations visited
tripMonth.value = [startYearMonth, endYearMonth]; // Date range as [year, month] arrays
tripDuration.value = Math.floor((finishTimestamp - startTimestamp) / DAY_24_HRS); // Duration in days
```

### Data Isolation
- **Device Isolation**: Each device maintains separate trip data using device UUID
- **Trip Isolation**: Each trip maintains separate data scope using trip UUID
- **Document Namespacing**: All documents properly namespaced with device + trip IDs
- **Query Efficiency**: Efficient queries using document ID ranges for trip-specific data

## Error Handling Strategy

### Error Types
The following error classes are implemented in `src/utils/database.ts`:
- **DatabaseConnectionError**: PouchDB connection/initialization failures
- **DocumentNotFoundError**: Requested document doesn't exist
- **ConflictError**: Document update conflicts (concurrent updates)
- **ValidationError**: Invalid data format or constraints
- **QuotaExceededError**: Storage quota exceeded

### Error Handling Implementation
```typescript
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
```

### Error Recovery
- **Retry mechanism for transient errors**: Implemented with exponential backoff
- **Conflict resolution for concurrent updates**: Trip updates retry up to 3 times on 409 conflicts
- **Graceful degradation when database unavailable**: App continues with current state
- **User-friendly error messages**: Displayed via reactive `error` state in useAppState

### Conflict Resolution Implementation
Trip updates include automatic retry logic for concurrent update conflicts:
```typescript
// Retry up to 3 times on conflicts
let retries = 3;
while (retries > 0) {
  try {
    // ... update logic
    await db.put(updatedDocument);
    return true;
  } catch (error) {
    if (error.status === 409 && retries > 1) {
      retries--;
      // Brief delay before retry to allow other operations to complete
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
      continue;
    }
    throw error;
  }
}
```

## Migration Considerations

### No Automatic Migration
- Existing localStorage data will NOT be automatically migrated
- Users start fresh with PouchDB
- "New travel" effectively creates a new trip

### Future Migration Support
- Optional import/export functionality for user-initiated migration
- JSON format for data portability
- Trip-level export/import for sharing

## Performance Specifications

### Indexing Strategy
- Index on `type + device_id + trip_id` for filtered queries
- Index on `created_at` for chronological sorting
- Consider compound indexes for complex queries

### Memory Management
- Load only current trip data into app state
- Implement pagination for large datasets (future enhancement)
- Cache frequently accessed documents

### Storage Limits
- Monitor database size growth
- Implement data cleanup for deleted trips (optional)
- Consider compression for large datasets

## Browser Compatibility

### Requirements
- Modern browsers with IndexedDB support
- PouchDB browser compatibility (IE11+, all modern browsers)
- Crypto API for UUID generation (fallback provided)

### Fallbacks
- Custom ID generation if crypto.randomUUID unavailable
- Error handling for quota exceeded scenarios
- Graceful degradation if PouchDB unavailable 