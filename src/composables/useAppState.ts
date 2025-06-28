import {computed, ref, onMounted} from 'vue';
import {useLocalStorage} from '@vueuse/core';
import type {Location, LocationsMap, StepsList} from '../types';
import {generateTripId, getOrCreateDeviceId, generateLocationId, generateStepId} from '../utils/ids';
import {
  addLocation as dbAddLocation,
  updateLocation as dbUpdateLocation,
  deleteLocation as dbDeleteLocation,
  getLocations as dbGetLocations,
  initializeDatabase
} from '../utils/database';

const error = ref<string | null>(null);

export function useAppState() {
  // Reactive state for PouchDB data
  const locations = ref<LocationsMap>({});
  const steps = useLocalStorage<StepsList>('trip-planner-steps', []);

  // Trip and device ID management (for session use)
  const currentTripId = ref<string | null>(null);
  const deviceId = ref<string>(getOrCreateDeviceId());

  // Loading states
  const isLoading = ref(false);

  // Initialize database and load data
  onMounted(async () => {
    try {
      await initializeDatabase();
      
      // Load locations if we have a current trip
      if (currentTripId.value) {
        await loadLocations();
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
      error.value = 'Failed to initialize database';
    }
  });

  // Load locations from PouchDB
  const loadLocations = async (): Promise<void> => {
    if (!currentTripId.value) return;
    
    try {
      isLoading.value = true;
      const locationsList = await dbGetLocations(deviceId.value, currentTripId.value);
      
      // Convert array to map for reactive state
      const locationsMap: LocationsMap = {};
      locationsList.forEach(location => {
        locationsMap[location.id] = location;
      });
      
      locations.value = locationsMap;
      error.value = null;
    } catch (err) {
      console.error('Failed to load locations:', err);
      error.value = 'Failed to load locations';
    } finally {
      isLoading.value = false;
    }
  };

  // Location operations
  const addLocation = async (locationData: Omit<Location, 'id'>): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    // Check if location with this name already exists
    const existingLocation = Object.values(locations.value).find(loc => loc.name === locationData.name);
    if (existingLocation) {
      error.value = 'Location with this name already exists';
      return false;
    }

    try {
      isLoading.value = true;
      const location = await dbAddLocation(deviceId.value, currentTripId.value, locationData);
      
      // Update reactive state
      locations.value[location.id] = location;
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to add location:', err);
      error.value = 'Failed to add location';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateLocation = async (locationId: string, updatedLocation: Omit<Location, 'id'>): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    if (!locations.value[locationId]) {
      error.value = 'Location not found';
      return false;
    }

    try {
      isLoading.value = true;
      await dbUpdateLocation(deviceId.value, currentTripId.value, locationId, updatedLocation);
      
      // Update reactive state
      locations.value[locationId] = {
        id: locationId,
        ...updatedLocation
      };
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to update location:', err);
      error.value = 'Failed to update location';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteLocation = async (locationId: string): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    // Check if location is used in any step
    const isUsed = steps.value.some(step =>
      step.startLocationId === locationId || step.finishLocationId === locationId,
    );

    if (isUsed) {
      error.value = 'Cannot delete location that is used in steps';
      return false;
    }

    try {
      isLoading.value = true;
      await dbDeleteLocation(deviceId.value, currentTripId.value, locationId);
      
      // Update reactive state
      delete locations.value[locationId];
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to delete location:', err);
      error.value = 'Failed to delete location';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Step operations
  const addStep = (step: Omit<StepsList[0], 'id'>) => {
    const newStep = {
      ...step,
      id: generateStepId(),
    };

    steps.value.push(newStep);
    error.value = null;
    return true;
  };

  const updateStep = (id: string, updatedStep: Partial<StepsList[0]>) => {
    const index = steps.value.findIndex(s => s.id === id);
    if (index === -1) {
      error.value = 'Step not found';
      return false;
    }

    steps.value[index] = {
      ...steps.value[index],
      ...updatedStep,
    };

    error.value = null;
    return true;
  };

  const deleteStep = (id: string) => {
    steps.value = steps.value.filter(s => s.id !== id);
    error.value = null;
    return true;
  };

  // Trip operations
  const createNewTrip = async (): Promise<string> => {
    const newTripId = generateTripId();
    currentTripId.value = newTripId;
    
    // Clear current locations and steps for new trip
    locations.value = {};
    steps.value = [];
    
    // Load locations for the new trip (should be empty)
    await loadLocations();
    
    error.value = null;
    return newTripId;
  };

  // Computed values
  const locationsList = computed(() => Object.values(locations.value));
  const sortedSteps = computed(() =>
    [...steps.value].sort((a, b) => {
      return a.startTimestamp - b.startTimestamp;
    }),
  );

  return {
    // State
    locations,
    steps,
    isLoading,
    error,
    currentTripId,
    deviceId,

    // Computed
    locationsList,
    sortedSteps,

    // Location operations
    addLocation,
    updateLocation,
    deleteLocation,
    loadLocations,

    // Step operations
    addStep,
    updateStep,
    deleteStep,

    // Trip operations
    createNewTrip,
  };
} 