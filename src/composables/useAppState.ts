import {computed, ref} from 'vue';
import {useLocalStorage} from '@vueuse/core';
import type {Location, LocationsMap, StepsList} from '../types';

const error = ref<string | null>(null);

export function useAppState() {
  // Persisted state using localStorage
  const locations = useLocalStorage<LocationsMap>('trip-planner-locations', {});
  const steps = useLocalStorage<StepsList>('trip-planner-steps', []);

  // Loading states
  const isLoading = ref(false);

  // Get next available location ID
  const getNextLocationId = () => {
    const existingIds = Object.keys(locations.value).map(Number);
    return existingIds.length === 0 ? 1 : Math.max(...existingIds) + 1;
  };

  // Location operations
  const addLocation = (locationData: Omit<Location, 'id'>) => {
    // Check if location with this name already exists
    const existingLocation = Object.values(locations.value).find(loc => loc.name === locationData.name);
    if (existingLocation) {
      error.value = 'Location with this name already exists';
      return false;
    }

    const newId = getNextLocationId();
    const location: Location = {
      id: newId,
      ...locationData
    };

    locations.value[newId] = location;
    error.value = null;
    return true;
  };

  const updateLocation = (locationId: number, updatedLocation: Omit<Location, 'id'>) => {
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

  const deleteLocation = (locationId: number) => {
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
      id: `S${Math.random().toString(36).substring(2, 9)}`,
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
  };
} 