<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useAppState} from '../composables/useAppState';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Card from 'primevue/card';

const {locations, addLocation, updateLocation, deleteLocation, error} = useAppState();

const deleteDialogVisible = ref(false);
const locationToDelete = ref('');
const addLocationDialogVisible = ref(false);
const newLocationName = ref('');

// Generate timezone options from -12 to +12
const timezoneOptions = Array.from({length: 25}, (_, i) => ({
  label: `UTC${i - 12 >= 0 ? '+' : ''}${i - 12}`,
  value: i - 12,
}));

// Convert locations object to array for cards with coordinatesString
const cardsData = computed(() =>
  Object.values(locations.value).map(location => ({
    ...location,
    coordinatesString: `${location.coordinates.lat}, ${location.coordinates.lng}`,
  })),
);

const showAddLocationDialog = () => {
  newLocationName.value = '';
  addLocationDialogVisible.value = true;
};

const cancelAddLocation = () => {
  addLocationDialogVisible.value = false;
  newLocationName.value = '';
};

const createLocation = () => {
  if (!newLocationName.value.trim()) return;

  const success = addLocation({
    name: newLocationName.value.trim(),
    coordinates: {lat: 0, lng: 0},
    timezone: 0,
  });

  if (success) {
    addLocationDialogVisible.value = false;
    newLocationName.value = '';
  }
};

const updateLocationData = (name: string, field: string, value: any) => {
  const location = locations.value[name];
  if (!location) return;

  let updatedData = {...location};

  // Handle coordinates parsing
  if (field === 'coordinatesString') {
    const coordinatesString = value?.trim();
    if (!coordinatesString) {
      error.value = 'Coordinates cannot be empty';
      return;
    }

    // Parse comma-separated coordinates
    const parts = coordinatesString.split(',').map((part: string) => part.trim());
    if (parts.length !== 2) {
      error.value = 'Coordinates must be in format "latitude, longitude"';
      return;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) {
      error.value = 'Coordinates must be valid numbers';
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      error.value = 'Latitude must be between -90 and 90';
      return;
    }

    if (lng < -180 || lng > 180) {
      error.value = 'Longitude must be between -180 and 180';
      return;
    }

    updatedData.coordinates = {lat, lng};
  } else if (field === 'timezone') {
    updatedData.timezone = value;
  }

  // Update location
  updateLocation(name, updatedData);
};

const onCoordinatesUpdate = (name: string, value: string) => {
  updateLocationData(name, 'coordinatesString', value);
};

const onTimezoneUpdate = (name: string, value: number) => {
  updateLocationData(name, 'timezone', value);
};

const confirmDelete = (name: string) => {
  locationToDelete.value = name;
  deleteDialogVisible.value = true;
};

const executeDelete = () => {
  deleteLocation(locationToDelete.value);
  deleteDialogVisible.value = false;
  locationToDelete.value = '';
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
          {{ location.name }}
        </template>

        <template #content>
          <div class="card-content">
            <div class="coordinates-row">
              <div class="coordinates-input">
                <label>
                  Coordinates
                  <a
                    :href="`https://www.google.com/maps/@${location.coordinates.lat},${location.coordinates.lng},11z`"
                    class="map-link"
                    rel="noopener noreferrer"
                    target="_blank"
                    title="Open in Google Maps"
                  >
                    Show on map
                  </a>
                </label>
                <InputText
                  :model-value="location.coordinatesString"
                  placeholder="lat, lng (e.g., 51.970710, 5.003546)"
                  @blur="onCoordinatesUpdate(location.name, ($event.target as HTMLInputElement).value)"
                  @keyup.enter="onCoordinatesUpdate(location.name, ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <div class="timezone-row">
              <label>Timezone</label>
              <Select
                :model-value="location.timezone"
                :options="timezoneOptions"
                optionLabel="label"
                optionValue="value"
                @change="onTimezoneUpdate(location.name, $event.value)"
              />
            </div>

            <div class="delete-button-container">
              <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                size="small"
                text
                @click="confirmDelete(location.name)"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Add Location Dialog -->
    <Dialog
      v-model:visible="addLocationDialogVisible"
      :modal="true"
      :style="{ width: '400px' }"
      header="Add New Location"
    >
      <div class="form-field">
        <label for="locationName">Location Name</label>
        <InputText
          id="locationName"
          v-model="newLocationName"
          autofocus
          placeholder="Enter location name"
          @keyup.enter="createLocation"
        />
      </div>
      <template #footer>
        <Button
          label="Cancel"
          text
          @click="cancelAddLocation"
        />
        <Button
          :disabled="!newLocationName.trim()"
          label="Create"
          @click="createLocation"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      :modal="true"
      :style="{ width: '400px' }"
      header="Confirm Delete"
    >
      <p>Are you sure you want to delete location "{{ locationToDelete }}"?</p>
      <template #footer>
        <Button
          label="Cancel"
          text
          @click="deleteDialogVisible = false"
        />
        <Button
          label="Delete"
          severity="danger"
          @click="executeDelete"
        />
      </template>
    </Dialog>

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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.location-card {
  min-height: 200px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  min-height: 120px;
}

.coordinates-row {
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
}

.coordinates-input {
  flex: 1;
}

.coordinates-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
  transition: color 0.3s ease;
}

.map-link {
  text-decoration: none;
  padding: 0.25em 0.5em;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #007bff;
  font-size: 0.75em;
  font-weight: 400;
  font-style: italic;

  &:hover {
    background-color: var(--color-link-hover, rgba(0, 123, 255, 0.1));
  }
}

.timezone-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 203px;

  label {
    font-weight: 600;
    color: var(--color-text);
    transition: color 0.3s ease;
  }
}


.delete-button-container {
  position: absolute;
  bottom: 0;
  right: 0;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
  transition: color 0.3s ease;
}

.form-field input {
  width: 100%;
}

/* Responsive design for smaller screens */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .cards-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .cards-header h2 {
    text-align: center;
  }
}
</style> 