<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useAppState} from '../../composables/useAppState.ts';
import Button from 'primevue/button';
import Card from 'primevue/card';
import LocationEditModal from './LocationEditModal.vue';
import type {Location} from '../../types';
import {formatTZ} from '../../utils/datetime.ts';

const {locationsList, addLocation, updateLocation, deleteLocation, isLoading} = useAppState();

const editLocationDialogVisible = ref(false);
const locationToEdit = ref<Location | null>(null);
const addLocationDialogVisible = ref(false);

// Convert locations list to cards data with coordinatesString
const cardsData = computed(() =>
  locationsList.value.map(location => ({
    ...location,
    coordinatesString: `${location.coordinates.lat}, ${location.coordinates.lng}`,
  })),
);

const showAddLocationDialog = () => {
  locationToEdit.value = null;
  addLocationDialogVisible.value = true;
};

const showEditLocationDialog = (location: Location) => {
  locationToEdit.value = location;
  editLocationDialogVisible.value = true;
};

const handleLocationSave = async (locationData: Location | {
  name: string;
  timezone: number;
  coordinates?: { lat: number; lng: number }
}) => {
  if ('id' in locationData) {
    // Editing existing location
    const success = await updateLocation(locationData.id, locationData);
    if (success) {
      editLocationDialogVisible.value = false;
      locationToEdit.value = null;
    }
  } else {
    // Creating new location
    const success = await addLocation({
      name: locationData.name,
      coordinates: locationData.coordinates || {lat: 0, lng: 0},
      timezone: locationData.timezone,
    });
    if (success) {
      addLocationDialogVisible.value = false;
    }
  }
};

const handleLocationDelete = async (locationId: string) => {
  const success = await deleteLocation(locationId);
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
        severity="secondary"
        size="small"
        :loading="isLoading"
        @click="showAddLocationDialog"
      />
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Loading locations...</p>
    </div>

    <div v-else class="cards-container">
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
                :loading="isLoading"
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

            <a
              :href="`https://www.google.com/maps/@${location.coordinates.lat},${location.coordinates.lng},11z`"
              class="map-link"
              rel="noopener noreferrer"
              target="_blank"
              title="Open in Google Maps"
            >
              <div class="marker"><span class="pi pi-map-marker"/></div>
              <div class="coordinate">
                {{ Math.abs(location.coordinates.lat) }}°
                {{ location.coordinates.lat >= 0 ? 'N' : 'S' }}
              </div>
              <div class="coordinate">
                {{ Math.abs(location.coordinates.lng) }}°
                {{ location.coordinates.lng >= 0 ? 'E' : 'W' }}
              </div>
            </a>
          </div>
        </template>
      </Card>
    </div>

    <!-- Add Location Modal -->
    <LocationEditModal
      v-model:visible="addLocationDialogVisible"
      :is-creating="true"
      :location="null"
      @save="handleLocationSave"
    />

    <!-- Edit Location Modal -->
    <LocationEditModal
      v-model:visible="editLocationDialogVisible"
      :location="locationToEdit"
      @delete="handleLocationDelete"
      @save="handleLocationSave"
    />
  </div>
</template>

<style scoped>
.locations-cards {
  padding: 1rem;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--color-text);
  opacity: 0.7;
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
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  column-gap: 0.25rem;
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

  .marker {
    grid-area: 1/1/3/2;
    align-self: center;
  }

  .pi {
    font-size: 0.875em;
  }

  .coordinate {
    font-variant: tabular-nums;
    line-height: 1;
    align-self: baseline;
  }
}
</style> 