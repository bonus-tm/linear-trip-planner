<script setup lang="ts">
import {ref, computed} from 'vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import LocationEditModal from './LocationEditModal.vue';
import {useAppState} from '../../composables/useAppState.ts';

const selectedLocationId = defineModel<string>();
defineProps<{
  placeholder?: string
}>();

const {locationsList, addLocation, isLoading} = useAppState();

// Convert locations to options for the select
const locationOptions = computed(() => 
  locationsList.value.map(location => ({
    label: location.name,
    value: location.id
  }))
);

// Location add modal state
const showLocationModal = ref(false);

// Handle new location creation
const handleLocationCreated = async (locationData: { name: string; timezone: number; coordinates?: { lat: number; lng: number } }) => {
  const newLocation = {
    name: locationData.name,
    coordinates: locationData.coordinates || {lat: 0, lng: 0},
    timezone: locationData.timezone,
  };
  
  const success = await addLocation(newLocation);
  
  if (success) {
    // Find the newly created location and select it
    const createdLocation = locationsList.value.find(loc => loc.name === locationData.name);
    if (createdLocation) {
      selectedLocationId.value = createdLocation.id;
    }
    showLocationModal.value = false;
  }
};
</script>

<template>
  <Select
    v-model="selectedLocationId"
    :invalid="!selectedLocationId"
    :options="locationOptions"
    optionLabel="label"
    optionValue="value"
    :placeholder="placeholder || 'Select location'"
    :disabled="isLoading"
  >
    <template #footer>
      <Button
        label="Create new location"
        fluid
        severity="secondary"
        text
        size="small"
        icon="pi pi-plus"
        :loading="isLoading"
        @click="showLocationModal = true"
      />
    </template>
  </Select>

  <!-- Location Add Modal -->
  <teleport to="body">
    <LocationEditModal
      v-model:visible="showLocationModal"
      :location="null"
      :is-creating="true"
      @save="handleLocationCreated"
    />
  </teleport>
</template>

<style scoped>
</style>