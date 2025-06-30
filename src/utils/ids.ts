// ID Generation Utilities for PouchDB Migration
// Implements Phase 2: ID Generation and Device Management

const DEVICE_ID_STORAGE_KEY = 'travel-timeline-device-id';
const TRIP_ID_STORAGE_KEY = 'travel-timeline-trip-id';

/**
 * Generate unique device ID using crypto.randomUUID()
 * Returns a standard UUID format suitable for PouchDB document IDs
 */
function generateDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Get existing device ID from localStorage or generate new one
 * Storage key: "travel-timeline-trip-id"
 * @returns Device ID string (UUID format)
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    console.log('Generated new device ID:', deviceId);
  }
  
  return deviceId;
}

/**
 * Get existing trip ID from localStorage or generate new one
 * Storage key: "travel-timeline-trip-id"
 * @returns Trip ID string (UUID format)
 */
export function getOrCreateTripId(): string {
  let tripId = localStorage.getItem(TRIP_ID_STORAGE_KEY);

  if (!tripId) {
    tripId = generateDeviceId();
    localStorage.setItem(TRIP_ID_STORAGE_KEY, tripId);
    console.log('Generated new trip ID:', tripId);
  }

  return tripId;
}

/**
 * Generate unique trip ID using crypto.randomUUID()
 * Used when "New travel" button is clicked
 * @returns Trip ID string (UUID format)
 */
export function generateTripId(): string {
  return crypto.randomUUID();
}

/**
 * Generate unique location ID using crypto.randomUUID()
 * @returns Location ID string (UUID format)
 */
export function generateLocationId(): string {
  return crypto.randomUUID();
}

/**
 * Generate unique step ID using crypto.randomUUID()
 * @returns Step ID string (UUID format)
 */
export function generateStepId(): string {
  return crypto.randomUUID();
}

/**
 * Validate that an ID is a proper UUID format
 * @param id - ID string to validate
 * @returns boolean indicating if ID is valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Get the current device ID (assumes it exists)
 * @returns Device ID string or null if not found
 */
export function getCurrentDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_STORAGE_KEY);
}

/**
 * Reset device ID (useful for testing or debugging)
 * Generates and stores a new device ID
 * @returns New device ID string
 */
export function resetDeviceId(): string {
  const newDeviceId = generateDeviceId();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
  console.log('Reset device ID to:', newDeviceId);
  return newDeviceId;
} 