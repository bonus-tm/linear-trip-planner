import {computed, nextTick, ref, watchEffect} from 'vue';
import type {Location, LocationsMap, Step, StepsList, Trip} from '../types';
import {generateTripId, getOrCreateDeviceId, getOrCreateTripId} from '../utils/ids';
import {
  addLocation as dbAddLocation,
  addStep as dbAddStep,
  createTrip as dbCreateTrip,
  deleteLocation as dbDeleteLocation,
  deleteStep as dbDeleteStep,
  deleteTrip as dbDeleteTrip,
  getAllTrips as dbGetAllTrips,
  getLocations as dbGetLocations,
  getSteps as dbGetSteps,
  initializeDatabase,
  loadTripData as dbLoadTripData,
  updateLocation as dbUpdateLocation,
  updateStep as dbUpdateStep,
  updateTrip as dbUpdateTrip,
  validateStepLocationReferences,
} from '../utils/database';
import {DAY_24_HRS, formatDurationDays, formatISOWithTZ, getDayBeginTimestamp} from '../utils/datetime';

const error = ref<string | null>(null);

// Reactive state for PouchDB data
const locations = ref<LocationsMap>({});
const steps = ref<StepsList>([]);
const currentTrip = ref<Trip | null>(null);
const allTrips = ref<Array<Trip & { id: string }>>([]);

// Trip and device ID management (for session use)
const currentTripId = ref<string | null>(null);
const deviceId = ref<string>(getOrCreateDeviceId());

// For title
const tripPlaces = ref('');
const tripMonth = ref('');
const tripDuration = ref('');

// Loading states
const isLoading = ref(false);

export function useAppState() {
  // Computed values
  const locationsList = computed(() => Object.values(locations.value));
  const sortedSteps = computed(() =>
    [...steps.value].sort((a, b) => {
      return a.startTimestamp - b.startTimestamp;
    }),
  );

  // Initialize database and load data
  const initState = async () => {
    try {
      await initializeDatabase();

      // Load all trips first
      await loadAllTrips();

      // Load data if we have a current trip
      if (!currentTripId.value) {
        currentTripId.value = getOrCreateTripId();
      }
      await loadTripData();

    } catch (err) {
      console.error('Failed to initialize database:', err);
      error.value = 'Failed to initialize database';
    }
  };

  // Load locations from PouchDB
  const loadLocations = async (): Promise<void> => {
    if (!currentTripId.value) {
      locations.value = {};
      return;
    }

    try {
      isLoading.value = true;
      const loadedLocations = await dbGetLocations(deviceId.value, currentTripId.value);

      // Convert array to map for app compatibility
      const locationsMap: LocationsMap = {};
      loadedLocations.forEach(location => {
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
    if (!currentTripId.value) {
      steps.value = [];
      return;
    }

    try {
      isLoading.value = true;
      const loadedSteps = await dbGetSteps(deviceId.value, currentTripId.value);
      steps.value = loadedSteps;
      error.value = null;
    } catch (err) {
      console.error('Failed to load steps:', err);
      error.value = 'Failed to load steps';
    } finally {
      isLoading.value = false;
    }
  };

  // Load trip data from PouchDB
  const loadTripData = async (): Promise<void> => {
    if (!currentTripId.value) {
      locations.value = {};
      steps.value = [];
      currentTrip.value = null;
      return;
    }

    try {
      isLoading.value = true;
      const data = await dbLoadTripData(deviceId.value, currentTripId.value);

      // Convert locations array to map for app compatibility
      const locationsMap: LocationsMap = {};
      data.locations.forEach(location => {
        locationsMap[location.id] = location;
      });

      locations.value = locationsMap;
      steps.value = data.steps;
      currentTrip.value = data.trip;
      error.value = null;
    } catch (err) {
      console.error('Failed to load trip data:', err);
      error.value = 'Failed to load trip data';
    } finally {
      isLoading.value = false;
    }
  };

  // Load all trips from PouchDB
  const loadAllTrips = async (): Promise<void> => {
    try {
      const trips = await dbGetAllTrips(deviceId.value);
      allTrips.value = trips;
      error.value = null;
    } catch (err) {
      console.error('Failed to load all trips:', err);
      error.value = 'Failed to load trips';
    }
  };

  // Switch to a specific trip
  const switchToTrip = async (tripId: string): Promise<void> => {
    if (currentTripId.value === tripId) {
      return; // Already on this trip
    }

    currentTripId.value = tripId;
    // Store the current trip ID in localStorage for persistence
    localStorage.setItem('travel-timeline-trip-id', tripId);

    // Load the trip data
    await loadTripData();
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
        ...updatedLocation,
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

      await nextTick();
      await updateTripInfo({
        places: tripPlaces.value,
        month: tripMonth.value,
        duration: tripDuration.value,
      });

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
        const fullUpdatedStep = {...steps.value[index], ...updatedStep} as Step;
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

      await nextTick();
      await updateTripInfo({
        places: tripPlaces.value,
        month: tripMonth.value,
        duration: tripDuration.value,
      });

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

      await nextTick();
      await updateTripInfo({
        places: tripPlaces.value,
        month: tripMonth.value,
        duration: tripDuration.value,
      });

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
    try {
      isLoading.value = true;
      const newTripId = generateTripId();

      // Create the trip document in PouchDB
      await dbCreateTrip(deviceId.value, newTripId, '', '', '');

      // Update app state
      currentTripId.value = newTripId;
      // Store the new trip ID in localStorage for persistence
      localStorage.setItem('travel-timeline-trip-id', newTripId);

      // Clear current locations and steps for new trip
      locations.value = {};
      steps.value = [];

      // Load the new trip data (should be empty except for trip info)
      await loadTripData();

      // Refresh the trips list to include the new trip
      await loadAllTrips();

      error.value = null;
      return newTripId;
    } catch (err) {
      console.error('Failed to create new trip:', err);
      error.value = 'Failed to create new trip';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTripInfo = async (data: Partial<Pick<Trip, 'places' | 'month' | 'duration'>>): Promise<boolean> => {
    console.log('update tripInfo', data);
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    try {
      isLoading.value = true;
      await dbUpdateTrip(deviceId.value, currentTripId.value, data);

      // Update reactive state
      if (currentTrip.value) {
        currentTrip.value = {
          ...currentTrip.value,
          ...data,
          updated_at: Date.now(),
        };
      }

      // Refresh the trips list to show updated information
      await loadAllTrips();

      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to update trip info:', err);
      error.value = 'Failed to update trip info';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTripInfo = async (): Promise<boolean> => {
    if (!currentTripId.value) {
      error.value = 'No active trip. Please create a new trip first.';
      return false;
    }

    try {
      isLoading.value = true;
      await dbDeleteTrip(deviceId.value, currentTripId.value);

      // Update reactive state
      if (currentTrip.value) {
        currentTrip.value = {
          ...currentTrip.value,
          deleted_at: Date.now(),
          updated_at: Date.now(),
        };
      }

      error.value = null;
      return true;
    } catch (err) {
      console.error('Failed to delete trip:', err);
      error.value = 'Failed to delete trip';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Update app and document titles
  watchEffect(() => {
    if (sortedSteps.value.length > 0) {
      const startTimezone = locations.value[sortedSteps.value[0].startLocationId].timezone;
      const start = getDayBeginTimestamp(sortedSteps.value[0].startTimestamp, startTimezone);

      const finishLocationId = sortedSteps.value[sortedSteps.value.length - 1]?.finishLocationId;
      const finishTimezone = finishLocationId
        ? locations.value[finishLocationId].timezone
        : 0;
      let finish = getDayBeginTimestamp(
        sortedSteps.value[sortedSteps.value.length - 1].finishTimestamp,
        finishTimezone,
      );
      finish += DAY_24_HRS;

      tripDuration.value = formatDurationDays(
        formatISOWithTZ(start, startTimezone),
        formatISOWithTZ(finish, finishTimezone),
      );
    } else {
      tripDuration.value = '';
    }

    const places = new Set();
    const months: Set<string> = new Set();

    const startLocationId = sortedSteps.value[0]?.startLocationId;
    if (startLocationId) {
      const startLocation = locations.value[startLocationId];
      if (startLocation) {
        places.add(startLocation.name);
      }
    }
    sortedSteps.value.forEach((step) => {
      months.add(step.startDate.substring(0, 7));
      months.add(step.finishDate.substring(0, 7));
      if (step.type === 'stay') {
        const stayLocation = locations.value[step.startLocationId];
        if (stayLocation) {
          places.add(stayLocation.name);
        }
      }
    });
    const finishLocationId = sortedSteps.value[sortedSteps.value.length - 1]?.finishLocationId;
    if (finishLocationId) {
      const finishLocation = locations.value[finishLocationId];
      if (finishLocation) {
        places.add(finishLocation.name);
      }
    }

    tripPlaces.value = Array.from(places).join('&thinsp;—&thinsp;');

    const monthsUniq: string[] = Array.from(months).sort();

    if (monthsUniq.length === 1) {
      const [y, m] = monthsUniq[0].split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      tripMonth.value = d.toLocaleDateString('en', {month: 'long', year: 'numeric'});
    } else if (monthsUniq.length > 1) {
      const first = monthsUniq[0];
      const last = monthsUniq[monthsUniq.length - 1];

      const [firstYear, firstMonth] = first.split('-');
      const [lastYear, lastMonth] = last.split('-');

      const firstDate = new Date(parseInt(firstYear), parseInt(firstMonth) - 1, 1);
      const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, 1);

      if (firstYear === lastYear) {
        // Same year: "January — March 2024"
        const firstMonthName = firstDate.toLocaleDateString('en', {month: 'long'});
        const lastMonthName = lastDate.toLocaleDateString('en', {month: 'long'});
        tripMonth.value = `${firstMonthName}&thinsp;—&thinsp;${lastMonthName} ${firstYear}`;
      } else {
        // Different years: "December 2023 — February 2024"
        const firstMonthYear = firstDate.toLocaleDateString('en', {month: 'long', year: 'numeric'});
        const lastMonthYear = lastDate.toLocaleDateString('en', {month: 'long', year: 'numeric'});
        tripMonth.value = `${firstMonthYear}&thinsp;—&thinsp;${lastMonthYear}`;
      }
    }
  });

  return {
    initState,

    // State
    locations,
    steps,
    currentTrip,
    allTrips,
    isLoading,
    error,
    currentTripId,
    deviceId,
    tripDuration,
    tripPlaces,
    tripMonth,

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
    updateTripInfo,
    deleteTripInfo,
    loadTripData,
    loadAllTrips,
    switchToTrip,
  };
} 