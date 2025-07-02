<script lang="ts" setup>
import Button from 'primevue/button';
import {useAppState} from '../composables/useAppState';
import {ref} from 'vue';

const {createNewTrip, isLoading} = useAppState();
const isResetting = ref(false);

const handleNewTravel = async () => {
  try {
    isResetting.value = true;

    // Generate new trip ID, create trip document, and clear all locations and steps
    // Old trip data remains in PouchDB (no deletion) as specified in requirements
    await createNewTrip();

    // Reset zoom level to 'fit' - keeping this in localStorage as specified
    localStorage.setItem('travel-timeline-zoom', 'fit');
  } catch (error) {
    console.error('Failed to create new trip:', error);
  } finally {
    isResetting.value = false;
  }
};
</script>

<template>
  <Button
    class="new-trip-button"
    icon="pi pi-pen-to-square"
    label="New trip"
    severity="secondary"
    :loading="isLoading || isResetting"
    @click="handleNewTravel"
  />
</template>

<style scoped>
.new-trip-button {
  margin: 1rem 1rem 0;
}
</style>