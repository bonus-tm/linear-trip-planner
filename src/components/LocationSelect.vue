<script setup lang="ts">
import {ref} from 'vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import LocationAddModal from './LocationAddModal.vue';
import {useAppState} from '../composables/useAppState';

const selectedLocation = defineModel<string>();
defineProps<{
  placeholder?: string
}>();

const {locationNames, addLocation} = useAppState();

// Location add modal state
const showLocationModal = ref(false);

// Handle new location creation
const handleLocationCreated = (locationData: { name: string; timezone: number }) => {
  const newLocation = {
    name: locationData.name,
    coordinates: {lat: 0, lng: 0},
    timezone: locationData.timezone,
  };
  addLocation(newLocation);
  selectedLocation.value = locationData.name;
  showLocationModal.value = false;
};
</script>

<template>
  <Select
    v-model="selectedLocation"
    :invalid="!selectedLocation"
    :options="locationNames"
    :placeholder="placeholder || 'Select location'"
  >
    <template #footer>
      <Button
        label="Create new location"
        fluid
        severity="secondary"
        text
        size="small"
        icon="pi pi-plus"
        @click="showLocationModal = true"
      />
    </template>
  </Select>

  <!-- Location Add Modal -->
  <teleport to="body">
    <LocationAddModal
      v-model:visible="showLocationModal"
      @save="handleLocationCreated"
    />
  </teleport>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 1rem;
}

.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}
</style>