<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useAppState} from '../composables/useAppState';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';
import LocationEditModal from './LocationEditModal.vue';
import LocationAddModal from './LocationAddModal.vue';
import type {Location} from '../types';
import {formatTZ} from '../utils/datetime.ts';

const {locations, addLocation, updateLocation, deleteLocation, error} = useAppState();

const editLocationDialogVisible = ref(false);
const locationToEdit = ref<Location | null>(null);
const addLocationDialogVisible = ref(false);

// Convert locations object to array for cards with coordinatesString
const cardsData = computed(() =>
  Object.values(locations.value).map(location => ({
    ...location,
    coordinatesString: `${location.coordinates.lat}, ${location.coordinates.lng}`,
  })),
);

const showAddLocationDialog = () => {
  addLocationDialogVisible.value = true;
};

const handleLocationAdd = (locationData: { name: string; timezone: number }) => {
  const success = addLocation({
    name: locationData.name,
    coordinates: {lat: 0, lng: 0},
    timezone: locationData.timezone,
  });

  if (success) {
    addLocationDialogVisible.value = false;
  }
};

const showEditLocationDialog = (location: Location) => {
  locationToEdit.value = location;
  editLocationDialogVisible.value = true;
};

const handleLocationSave = (updatedLocation: Location) => {
  const originalName = locationToEdit.value?.name;
  if (!originalName) return;

  const success = updateLocation(originalName, updatedLocation);
  if (success) {
    editLocationDialogVisible.value = false;
    locationToEdit.value = null;
  }
};

const handleLocationDelete = (locationName: string) => {
  const success = deleteLocation(locationName);
  if (success) {
    editLocationDialogVisible.value = false;
    locationToEdit.value = null;
  }
};
</script>

<template>
  <div class="locations-cards">
    <div class="cards-header">
      <h2>Locations</h2>
      <Button
        icon="pi pi-plus"
        label="Add Location"
        size="small"
        @click="showAddLocationDialog"
      />
    </div>

    <div class="cards-container">
      <Card v-for="location in cardsData" :key="location.name" class="location-card">
        <template #title>
          <div class="card-title">
            <div class="location-name">{{ location.name }}</div>
            <div class="edit-button-container">
              <Button
                icon="pi pi-pencil"
                rounded
                size="small"
                text
                @click="showEditLocationDialog(location)"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div class="card-content">
            <div class="timezone-info">
              GMT{{ formatTZ(location.timezone) }}
            </div>

            <div class="coordinates">
              <a
                :href="`https://www.google.com/maps/@${location.coordinates.lat},${location.coordinates.lng},11z`"
                class="map-link"
                rel="noopener noreferrer"
                target="_blank"
                title="Open in Google Maps"
              >
                <span class="pi pi-map-marker"/>
                {{ location.coordinatesString }}
              </a>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Add Location Modal -->
    <LocationAddModal
      v-model:visible="addLocationDialogVisible"
      @save="handleLocationAdd"
    />

    <!-- Edit Location Modal -->
    <LocationEditModal
      v-model:visible="editLocationDialogVisible"
      :location="locationToEdit"
      @delete="handleLocationDelete"
      @save="handleLocationSave"
    />

    <Message v-if="error" :closable="true" severity="error" @close="error = null">
      {{ error }}
    </Message>
  </div>
</template>

<style scoped>
.locations-cards {
  margin-bottom: 2rem;
}

.cards-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

h2 {
  margin: 0;
  color: var(--color-text);
  transition: color 0.3s ease;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.edit-button-container {
  margin-inline-start: auto;
}

.timezone-info {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.6;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.map-link {
  text-decoration: none;
  padding: 0.25em 0.5em;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #007bff;
  font-size: 0.875em;
  font-weight: 400;

  &:hover {
    background-color: var(--color-link-hover, rgba(0, 123, 255, 0.1));
  }

  .pi {
    font-size: 0.875em;
  }
}
</style> 