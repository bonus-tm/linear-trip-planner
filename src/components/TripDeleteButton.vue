<script lang="ts" setup>
import Button from 'primevue/button';
import {useConfirm} from 'primevue/useconfirm';
import {useAppState} from '../composables/useAppState';

const {
  deleteEntireTrip,
  allTrips,
  switchToTrip,
  currentTripId,
  currentTrip,
  isLoading,
  error,
} = useAppState();

const confirm = useConfirm();

const handleDeleteTrip = () => {
  if (!currentTripId.value || !currentTrip.value) {
    return;
  }

  const tripName = currentTrip.value.places.join(' → ') || 'Current Trip';

  confirm.require({
    message: `Are you sure you want to delete "${tripName}"? This will permanently remove all locations and steps in this trip.`,
    header: 'Delete Trip',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        // Delete the current trip completely (hard delete)
        const success = await deleteEntireTrip();

        if (success) {
          // Find the first available trip that's not the current one
          const availableTrips = allTrips.value.filter(trip => trip.id !== currentTripId.value);

          if (availableTrips.length > 0) {
            // Switch to the first available trip
            await switchToTrip(availableTrips[0].id);
          } else {
            // No trips available - this should create a new trip or handle empty state
            // The UI should handle the empty state gracefully
            console.log('No more trips available');
          }
        }
      } catch (err) {
        console.error('Failed to delete trip:', err);
        error.value = 'Failed to delete trip';
      }
    },
  });
};
</script>

<template>
  <div class="trip-delete-section">
    <Button
      :disabled="!currentTripId || isLoading"
      :loading="isLoading"
      icon="pi pi-trash"
      severity="danger"
      size="small"
      text
      v-tooltip.left="'Delete Trip'"
      @click="handleDeleteTrip"
    />
  </div>
</template>

<style scoped>
.trip-delete-section {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;

  button {
    margin-inline-start: auto;
  }
}
</style> 