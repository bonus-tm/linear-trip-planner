<script lang="ts" setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import type { Location } from '../../types';

interface Props {
  visible: boolean;
  location: Location | null;
  isCreating?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', location: Location | { name: string; timezone: number; coordinates?: { lat: number; lng: number } }): void;
  (e: 'delete', locationId: string): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false,
});
const emit = defineEmits<Emits>();

const localVisible = ref(false);
const editForm = ref({
  name: '',
  coordinatesString: '',
  timezone: 0,
});

// Generate timezone options from -12 to +12
const timezoneOptions = Array.from({length: 25}, (_, i) => ({
  label: `UTC${i - 12 >= 0 ? '+' : ''}${i - 12}`,
  value: i - 12,
}));

const error = ref<string | null>(null);

// Watch for visibility changes
watch(() => props.visible, (newValue) => {
  localVisible.value = newValue;
  if (newValue) {
    if (props.isCreating) {
      // Reset form for new location
      editForm.value = {
        name: '',
        coordinatesString: '',
        timezone: 0,
      };
    } else if (props.location) {
      // Initialize form with location data
      editForm.value = {
        name: props.location.name,
        coordinatesString: `${props.location.coordinates.lat}, ${props.location.coordinates.lng}`,
        timezone: props.location.timezone,
      };
    }
    error.value = null;
  }
});

// Watch for local visibility changes
watch(localVisible, (newValue) => {
  emit('update:visible', newValue);
});

const validateAndSave = () => {
  error.value = null;
  
  if (!editForm.value.name.trim()) {
    error.value = 'Location name cannot be empty';
    return;
  }

  if (props.isCreating) {
    // For creating, coordinates are optional
    if (editForm.value.coordinatesString.trim()) {
      // Parse coordinates if provided
      const parts = editForm.value.coordinatesString.split(',').map(part => part.trim());
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

      emit('save', {
        name: editForm.value.name.trim(),
        timezone: editForm.value.timezone,
        coordinates: { lat, lng }
      });
    } else {
      // No coordinates provided for new location
      emit('save', {
        name: editForm.value.name.trim(),
        timezone: editForm.value.timezone
      });
    }
  } else {
    // For editing, if coordinates are empty, default to "0, 0"
    if (!editForm.value.coordinatesString.trim()) {
      editForm.value.coordinatesString = '0, 0';
    }

    // Parse coordinates
    const parts = editForm.value.coordinatesString.split(',').map(part => part.trim());
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

    // Create updated location object
    const updatedLocation: Location = {
      id: props.location!.id, // Keep the original ID
      name: editForm.value.name.trim(),
      coordinates: { lat, lng },
      timezone: editForm.value.timezone,
    };

    emit('save', updatedLocation);
  }
  
  localVisible.value = false;
};

const handleDelete = () => {
  if (props.location) {
    emit('delete', props.location.id);
    localVisible.value = false;
  }
};

const handleCancel = () => {
  error.value = null;
  emit('close');
  localVisible.value = false;
};
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    :modal="true"
    :style="{ width: '450px' }"
    :header="isCreating ? 'New Location' : 'Edit Location'"
  >
    <div class="edit-form">
      <div class="form-field">
        <label for="locationName">Location Name *</label>
        <InputText
          id="locationName"
          v-model="editForm.name"
          :autofocus="isCreating"
          placeholder="Enter location name"
          @keyup.enter="validateAndSave"
        />
      </div>

      <div class="form-field">
        <label for="timezone">Timezone *</label>
        <Select
          id="timezone"
          v-model="editForm.timezone"
          :options="timezoneOptions"
          optionLabel="label"
          optionValue="value"
          class="timezone-select"
        />
      </div>

      <div class="form-field">
        <label for="coordinates">
          Coordinates{{ isCreating ? ' (optional)' : ' *' }}
          <a
            v-if="!isCreating && location"
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
          id="coordinates"
          v-model="editForm.coordinatesString"
          placeholder="lat, lng (e.g., 51.970710, 5.003546)"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <div class="left-actions">
          <Button
            v-if="!isCreating"
            icon="pi pi-trash"
            label="Delete"
            severity="danger"
            text
            @click="handleDelete"
          />
        </div>
        <div class="right-actions">
          <Button
            label="Cancel"
            text
            @click="handleCancel"
          />
          <Button
            :disabled="!editForm.name.trim()"
            :label="isCreating ? 'Create' : 'Save'"
            @click="validateAndSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
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
  margin-left: 0.5rem;

  &:hover {
    background-color: var(--color-link-hover, rgba(0, 123, 255, 0.1));
  }
}

.timezone-select {
  width: 100%;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  background-color: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left-actions,
.right-actions {
  display: flex;
  gap: 0.5rem;
}
</style> 