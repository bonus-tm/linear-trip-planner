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
- **Key**: `"tavel-timeline-zoom"` → **Value**: ZoomLevel ('fit' | number)  
- **Key**: `"tavel-timeline-device-id"` → **Value**: string (generated UUID)

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
- **Storage**: localStorage with key `"tavel-timeline-device-id"`
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
  data: {
    name: string;
    coordinates: { lat: number; lng: number };
    timezone: number; // -12 to +12 UTC offset
  };
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
  data: {
    type: 'move' | 'stay';
    startDate: string; // ISO datetime
    finishDate: string; // ISO datetime  
    startTimestamp: number;
    finishTimestamp: number;
    startLocationId: string; // Location UUID only (device_id + trip_id can be derived from step document)
    finishLocationId?: string; // Location UUID only (only for 'move' type)
    startAirport?: string; // 3 letters, optional
    finishAirport?: string; // 3 letters, optional
    description?: string; // optional
  };
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
  "data": {
    "type": "move",
    "startLocationId": "9876543a-bcde-f012-3456-789abcdef012",
    "finishLocationId": "fedcba98-7654-3210-fedc-ba9876543210",
    "startDate": "2024-01-15T10:00:00.000Z",
    "finishDate": "2024-01-15T14:30:00.000Z",
    "startTimestamp": 1705311600000,
    "finishTimestamp": 1705327800000
  }
}
```

**Note**: To get the full location document ID, combine: `${step.device_id}>${step.trip_id}>location>${step.data.startLocationId}`

### Trip Info Documents (New)
```typescript
interface TripDocument {
  _id: string; // Format: "${device_id}>${trip_id}>trip"
  _rev?: string; // PouchDB revision
  type: 'trip';
  device_id: string; // UUID
  trip_id: string; // UUID
  data: {
    created_at: number; // timestamp
    updated_at: number; // timestamp  
    deleted_at?: number; // timestamp, optional (soft delete)
    title: string;
    subtitle: string;
  };
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
  const storageKey = 'tavel-timeline-device-id';
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
  const locationIds = [stepDocument.data.startLocationId];
  if (stepDocument.data.finishLocationId) {
    locationIds.push(stepDocument.data.finishLocationId);
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

// Function to create new trip
const createNewTrip = () => {
  const newTripId = generateTripId();
  currentTripId.value = newTripId;
  // Clear current data for new trip
  locations.value = {};
  steps.value = [];
  return newTripId;
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
  createTrip(deviceId: string, tripId: string, title: string, subtitle: string): Promise<boolean>;
  updateTrip(deviceId: string, tripId: string, data: Partial<{ title: string; subtitle: string }>): Promise<boolean>;
  deleteTrip(deviceId: string, tripId: string): Promise<boolean>; // Soft delete
  getTrip(deviceId: string, tripId: string): Promise<TripInfo | null>;
  
  // Batch operations
  loadTripData(deviceId: string, tripId: string): Promise<{ locations: Location[]; steps: Step[]; trip: TripInfo }>;
  
  // Reference utilities  
  resolveLocationReferences(steps: Step[], locations: Location[]): Step[]; // Convert location UUIDs to location objects for app use
  createLocationReferences(steps: Step[]): Step[]; // Convert location objects to location UUIDs for storage
  getLocationDocIdsFromStep(stepDocument: StepDocument): string[]; // Get full location document IDs for a step
}
```

## Error Handling Strategy

### Error Types
- **DatabaseConnectionError**: PouchDB connection/initialization failures
- **DocumentNotFoundError**: Requested document doesn't exist
- **ConflictError**: Document update conflicts (concurrent updates)
- **ValidationError**: Invalid data format or constraints
- **QuotaExceededError**: Storage quota exceeded

### Error Recovery
- Retry mechanism for transient errors
- Conflict resolution for concurrent updates
- Graceful degradation when database unavailable
- User-friendly error messages

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