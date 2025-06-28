import {computed, ref, onMounted} from 'vue';
import {useLocalStorage} from '@vueuse/core';
import type {Location, LocationsMap, StepsList, Step} from '../types';
import {generateTripId, getOrCreateDeviceId, generateLocationId, generateStepId} from '../utils/ids';
import {
  addLocation as dbAddLocation,
  updateLocation as dbUpdateLocation,
  deleteLocation as dbDeleteLocation,
  getLocations as dbGetLocations,
  addStep as dbAddStep,
  updateStep as dbUpdateStep,
  deleteStep as dbDeleteStep,
  getSteps as dbGetSteps,
  validateStepLocationReferences,
  initializeDatabase
} from '../utils/database';

const error = ref<string | null>(null);

export function useAppState() {
  // Reactive state for PouchDB data
  const locations = ref<LocationsMap>({});
  const steps = ref<StepsList>([]);

  // Trip and device ID management (for session use)
  const currentTripId = ref<string | null>(null);
  const deviceId = ref<string>(getOrCreateDeviceId());

  // Loading states
  const isLoading = ref(false);

  // Initialize database and load data
  onMounted(async () => {
    try {
      await initializeDatabase();
      
      // Load data if we have a current trip
      if (currentTripId.value) {
        await Promise.all([
          loadLocations(),
          loadSteps()
        ]);
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

  // Load steps from PouchDB
  const loadSteps = async (): Promise<void> => {
    if (!currentTripId.value) return;
    
    try {
      isLoading.value = true;
      const stepsList = await dbGetSteps(deviceId.value, currentTripId.value);
      
      steps.value = stepsList;
      error.value = null;
    } catch (err) {
      console.error('Failed to load steps:', err);
      error.value = 'Failed to load steps';
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
  const addStep = async (step: Omit<Step, 'id'>): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    try {
      isLoading.value = true;
      
      // Validate location references exist
      const isValid = await validateStepLocationReferences(deviceId.value, currentTripId.value, step as Step);
      if (!isValid) {
        error.value = 'Referenced locations do not exist';
        return false;
      }
      
      const createdStep = await dbAddStep(deviceId.value, currentTripId.value, step);
      
      // Update reactive state
      steps.value.push(createdStep);
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to add step:', err);
      error.value = 'Failed to add step';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStep = async (stepId: string, updatedStep: Partial<Omit<Step, 'id'>>): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    const index = steps.value.findIndex(s => s.id === stepId);
    if (index === -1) {
      error.value = 'Step not found';
      return false;
    }

    try {
      isLoading.value = true;

      // If location references are being updated, validate them
      if (updatedStep.startLocationId || updatedStep.finishLocationId) {
        const fullUpdatedStep = { ...steps.value[index], ...updatedStep } as Step;
        const isValid = await validateStepLocationReferences(deviceId.value, currentTripId.value, fullUpdatedStep);
        if (!isValid) {
          error.value = 'Referenced locations do not exist';
          return false;
        }
      }

      await dbUpdateStep(deviceId.value, currentTripId.value, stepId, updatedStep);
      
      // Update reactive state
      steps.value[index] = {
        ...steps.value[index],
        ...updatedStep,
      };
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to update step:', err);
      error.value = 'Failed to update step';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteStep = async (stepId: string): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    try {
      isLoading.value = true;
      await dbDeleteStep(deviceId.value, currentTripId.value, stepId);
      
      // Update reactive state
      steps.value = steps.value.filter(s => s.id !== stepId);
      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to delete step:', err);
      error.value = 'Failed to delete step';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Trip operations
  const createNewTrip = async (): Promise<string> => {
    const newTripId = generateTripId();
    currentTripId.value = newTripId;
    
    // Clear current locations and steps for new trip
    locations.value = {};
    steps.value = [];
    
    // Load data for the new trip (should be empty)
    await Promise.all([
      loadLocations(),
      loadSteps()
    ]);
    
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
    loadSteps,

    // Trip operations
    createNewTrip,
  };
} 