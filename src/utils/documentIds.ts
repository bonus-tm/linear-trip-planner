// Document ID Utilities for PouchDB
// Implements document ID creation and parsing with ">" separator format

/**
 * Create location document ID
 * Format: "${device_id}>${trip_id}>location>${location_id}"
 */
export function createLocationDocId(deviceId: string, tripId: string, locationId: string): string {
  return `${deviceId}>${tripId}>location>${locationId}`;
}

/**
 * Create step document ID  
 * Format: "${device_id}>${trip_id}>step>${step_id}"
 */
export function createStepDocId(deviceId: string, tripId: string, stepId: string): string {
  return `${deviceId}>${tripId}>step>${stepId}`;
}

/**
 * Create trip document ID
 * Format: "${device_id}>${trip_id}>trip"
 */
export function createTripDocId(deviceId: string, tripId: string): string {
  return `${deviceId}>${tripId}>trip`;
}

/**
 * Parse document ID back to component parts
 * Handles the new ">" separator format
 * @param docId - Document ID to parse
 * @returns Parsed components or null if invalid format
 */
export function parseDocumentId(docId: string): { 
  deviceId: string; 
  tripId: string; 
  type: string; 
  entityId?: string 
} | null {
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

/**
 * Convert location ID to full PouchDB document ID reference
 * Used for building complete document IDs for querying
 */
export function getLocationDocumentId(deviceId: string, tripId: string, locationId: string): string {
  return createLocationDocId(deviceId, tripId, locationId);
}

/**
 * Build location document ID from step document context
 * @param stepDocument - Step document containing device_id and trip_id
 * @param locationId - Location UUID
 * @returns Full location document ID
 */
export function buildLocationDocIdFromStep(stepDocument: any, locationId: string): string {
  return `${stepDocument.device_id}>${stepDocument.trip_id}>location>${locationId}`;
}

/**
 * Extract location ID from full PouchDB document ID reference
 * @param locationDocId - Full location document ID
 * @returns Location ID (UUID) or null if invalid
 */
export function getLocationIdFromReference(locationDocId: string): string | null {
  const parsed = parseDocumentId(locationDocId);
  if (parsed?.type === 'location') {
    return parsed.entityId || null;
  }
  return null;
}

/**
 * Get location document IDs for a step (for querying locations)
 * @param stepDocument - Step document with location references
 * @returns Array of location document IDs
 */
export function getStepLocationDocIds(stepDocument: any): string[] {
  const locationIds = [stepDocument.data.startLocationId];
  if (stepDocument.data.finishLocationId) {
    locationIds.push(stepDocument.data.finishLocationId);
  }
  return locationIds.map(locId => buildLocationDocIdFromStep(stepDocument, locId));
}

/**
 * Validate document ID format
 * @param docId - Document ID to validate
 * @returns boolean indicating if format is valid
 */
export function isValidDocumentId(docId: string): boolean {
  const parsed = parseDocumentId(docId);
  return parsed !== null;
}

/**
 * Extract device and trip IDs from any document ID
 * @param docId - Any document ID
 * @returns Object with deviceId and tripId or null
 */
export function getDeviceAndTripFromDocId(docId: string): { deviceId: string; tripId: string } | null {
  const parsed = parseDocumentId(docId);
  if (parsed) {
    return { deviceId: parsed.deviceId, tripId: parsed.tripId };
  }
  return null;
} 