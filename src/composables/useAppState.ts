import {computed, ref} from 'vue';
import {useLocalStorage} from '@vueuse/core';
import type {Location, LocationsMap, StepsList} from '../types';
import {generateTripId, getOrCreateDeviceId, generateLocationId, generateStepId} from '../utils/ids';

const error = ref<string | null>(null);

export function useAppState() {
  // Persisted state using localStorage
  const locations = useLocalStorage<LocationsMap>('trip-planner-locations', {});
  const steps = useLocalStorage<StepsList>('trip-planner-steps', []);

  // Trip and device ID management (for session use)
  const currentTripId = ref<string | null>(null);
  const deviceId = ref<string>(getOrCreateDeviceId());

  // Loading states
  const isLoading = ref(false);

  // Location operations
  const addLocation = (locationData: Omit<Location, 'id'>) => {
    // Check if location with this name already exists
    const existingLocation = Object.values(locations.value).find(loc => loc.name === locationData.name);
    if (existingLocation) {
      error.value = 'Location with this name already exists';
      return false;
    }

    const newId = generateLocationId();
    const location: Location = {
      id: newId,
      ...locationData
    };

    locations.value[newId] = location;
    error.value = null;
    return true;
  };

  const updateLocation = (locationId: string, updatedLocation: Omit<Location, 'id'>) => {
    if (!locations.value[locationId]) {
      error.value = 'Location not found';
      return false;
    }

    locations.value[locationId] = {
      id: locationId,
      ...updatedLocation
    };

    error.value = null;
    return true;
  };

  const deleteLocation = (locationId: string) => {
    // Check if location is used in any step
    const isUsed = steps.value.some(step =>
      step.startLocationId === locationId || step.finishLocationId === locationId,
    );

    if (isUsed) {
      error.value = 'Cannot delete location that is used in steps';
      return false;
    }

    delete locations.value[locationId];
    error.value = null;
    return true;
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
  const createNewTrip = () => {
    const newTripId = generateTripId();
    currentTripId.value = newTripId;
    
    // Clear current locations and steps for new trip
    locations.value = {};
    steps.value = [];
    
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

    // Step operations
    addStep,
    updateStep,
    deleteStep,

    // Trip operations
    createNewTrip,
  };
} 