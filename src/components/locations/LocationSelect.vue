<script lang="ts" setup>
import {computed, ref} from 'vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import {useAppState} from '../../composables/useAppState';
import LocationEditModal from './LocationEditModal.vue';

const selectedLocationId = defineModel<string>();
defineProps<{
  placeholder?: string;
  tabindex?: number | string;
}>();

const {locationsList, addLocation, isLoading} = useAppState();

// Convert locations to options for the select
const locationOptions = computed(() =>
  locationsList.value.map(location => ({
    label: location.name,
    value: location.id,
  })),
);

// Location add modal state
const showLocationModal = ref(false);

// Handle new location creation
const handleLocationCreated = async (locationData: {
  name: string;
  timezone: number;
  coordinates?: { lat: number; lng: number }
}) => {
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
    :disabled="isLoading"
    :invalid="!selectedLocationId"
    :options="locationOptions"
    :placeholder="placeholder || 'Select location'"
    :tabindex="Number(tabindex)"
    optionLabel="label"
    optionValue="value"
  >
    <template #footer>
      <Button
        :loading="isLoading"
        fluid
        icon="pi pi-plus"
        label="Create new location"
        severity="secondary"
        size="small"
        text
        @click="showLocationModal = true"
      />
    </template>
  </Select>

  <!-- Location Add Modal -->
  <teleport to="body">
    <LocationEditModal
      v-model:visible="showLocationModal"
      :is-creating="true"
      :location="null"
      @save="handleLocationCreated"
    />
  </teleport>
</template>

<style scoped>
</style>