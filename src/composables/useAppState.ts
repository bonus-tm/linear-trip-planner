import {computed, ref} from 'vue';
import {useLocalStorage} from '@vueuse/core';
import type {Location, LocationsMap, StepsList} from '../types';

export function useAppState() {
  // Persisted state using localStorage
  const locations = useLocalStorage<LocationsMap>('trip-planner-locations', {});
  const steps = useLocalStorage<StepsList>('trip-planner-steps', []);

  // Loading states
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Location operations
  const addLocation = (location: Location) => {
    if (locations.value[location.name]) {
      error.value = 'Location with this name already exists';
      return false;
    }

    locations.value[location.name] = {...location};
    error.value = null;
    return true;
  };

  const updateLocation = (locationId: string, updatedLocation: Omit<LocationsMap[string], 'daylight'>) => {
    if (!locations.value[locationId]) {
      error.value = 'Location not found';
      return false;
    }

    locations.value[locationId] = {...updatedLocation};

    error.value = null;
    return true;
  };

  const deleteLocation = (name: string) => {
    // Check if location is used in any step
    const isUsed = steps.value.some(step =>
      step.startLocation === name || step.finishLocation === name,
    );

    if (isUsed) {
      error.value = 'Cannot delete location that is used in steps';
      return false;
    }

    delete locations.value[name];
    error.value = null;
    return true;
  };

  // Step operations
  const addStep = (step: Omit<StepsList[0], 'id'>) => {
    const newStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
  const locationNames = computed(() => Object.keys(locations.value));
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
    locationNames,
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