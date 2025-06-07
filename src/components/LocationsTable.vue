<template>
  <div class="locations-table">
    <div class="table-header">
      <h2>Locations</h2>
      <Button 
        icon="pi pi-plus" 
        label="Add Location" 
        size="small"
        @click="showAddLocationDialog"
      />
    </div>
    
    <DataTable 
      :value="tableData" 
      editMode="cell"
      responsiveLayout="scroll"
      size="small"
      @cell-edit-complete="onCellEditComplete"
    >
      <Column field="name" header="Name">
        <template #body="{ data }">
          {{ data.name }}
        </template>
      </Column>
      
      <Column style="width: 24px">
        <template #body="{ data }">
          <a 
            :href="`https://www.google.com/maps/@${data.coordinates.lat},${data.coordinates.lng},11z`"
            class="map-link"
            rel="noopener noreferrer"
            target="_blank"
            title="Open in Google Maps"
          >
            <i class="pi pi-map-marker" style="font-size: 1.2em; color: #007bff;"></i>
          </a>
        </template>
      </Column>
      
      <Column field="coordinatesString" header="Coordinates">
        <template #body="{ data }">
          {{ data.coordinatesString }}
        </template>
        <template #editor="{ data }">
          <InputText 
            v-model="data.coordinatesString"
            autofocus
            placeholder="lat, lng (e.g., 51.970710, 5.003546)"
          />
        </template>
      </Column>
      
      <Column field="timezone" header="Timezone (UTC)">
        <template #body="{ data }">
          UTC{{ data.timezone >= 0 ? '+' : '' }}{{ data.timezone }}
        </template>
        <template #editor="{ data }">
          <Select 
            v-model="data.timezone" 
            :options="timezoneOptions"
            optionLabel="label"
            optionValue="value"
          />
        </template>
      </Column>
      
      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <Button 
            icon="pi pi-trash" 
            rounded
            severity="danger"
            size="small"
            text
            @click="confirmDelete(data.name)"
          />
        </template>
      </Column>
    </DataTable>

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

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAppState } from '../composables/useAppState'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

const { locations, addLocation, updateLocation, deleteLocation, error } = useAppState()

const deleteDialogVisible = ref(false)
const locationToDelete = ref('')
const addLocationDialogVisible = ref(false)
const newLocationName = ref('')

// Generate timezone options from -12 to +12
const timezoneOptions = Array.from({ length: 25 }, (_, i) => ({
  label: `UTC${i - 12 >= 0 ? '+' : ''}${i - 12}`,
  value: i - 12
}))

// Convert locations object to array for DataTable with coordinatesString
const tableData = computed(() => 
  Object.values(locations.value).map(location => ({
    ...location,
    coordinatesString: `${location.coordinates.lat}, ${location.coordinates.lng}`
  }))
)

const showAddLocationDialog = () => {
  newLocationName.value = ''
  addLocationDialogVisible.value = true
}

const cancelAddLocation = () => {
  addLocationDialogVisible.value = false
  newLocationName.value = ''
}

const createLocation = () => {
  if (!newLocationName.value.trim()) return
  
  const success = addLocation({
    name: newLocationName.value.trim(),
    coordinates: { lat: 0, lng: 0 },
    timezone: 0
  })
  
  if (success) {
    addLocationDialogVisible.value = false
    newLocationName.value = ''
  }
}

const onCellEditComplete = (event: any) => {
  console.log(event)
  const { newData: data, field } = event
  console.log('onCellEditComplete', field, data)
  
  // Handle coordinates parsing
  if (field === 'coordinatesString') {
    const coordinatesString = data.coordinatesString?.trim()
    if (!coordinatesString) {
      error.value = 'Coordinates cannot be empty'
      return
    }
    
    // Parse comma-separated coordinates
    const parts = coordinatesString.split(',').map((part: string) => part.trim())
    if (parts.length !== 2) {
      error.value = 'Coordinates must be in format "latitude, longitude"'
      return
    }
    
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    
    if (isNaN(lat) || isNaN(lng)) {
      error.value = 'Coordinates must be valid numbers'
      return
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      error.value = 'Latitude must be between -90 and 90'
      return
    }
    
    if (lng < -180 || lng > 180) {
      error.value = 'Longitude must be between -180 and 180'
      return
    }
    
    // Update the data object with parsed coordinates
    data.coordinates = { lat, lng }
  }
  
  // Update location (name cannot be changed as it's the immutable ID)
  updateLocation(data.name, {
    name: data.name,
    coordinates: data.coordinates,
    timezone: data.timezone
  })
}

const confirmDelete = (name: string) => {
  locationToDelete.value = name
  deleteDialogVisible.value = true
}

const executeDelete = () => {
  deleteLocation(locationToDelete.value)
  deleteDialogVisible.value = false
  locationToDelete.value = ''
}
</script>

<style scoped>
.locations-table {
  margin-bottom: 2rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h2 {
  margin: 0;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-field input {
  width: 100%;
}

.map-link {
  display: inline-block;
  text-decoration: none;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.map-link:hover {
  background-color: #f0f8ff;
}
</style> 