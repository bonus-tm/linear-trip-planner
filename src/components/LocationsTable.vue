<template>
  <div class="locations-table">
    <div class="table-header">
      <h2>Locations</h2>
      <Button 
        icon="pi pi-plus" 
        label="Add Location" 
        @click="addNewLocation"
        size="small"
      />
    </div>
    
    <DataTable 
      :value="tableData" 
      editMode="cell"
      @cell-edit-complete="onCellEditComplete"
      responsiveLayout="scroll"
      size="small"
    >
      <Column field="name" header="Name">
        <template #editor="{ data }">
          <InputText v-model="data.name" autofocus />
        </template>
      </Column>
      
      <Column field="coordinates.lat" header="Latitude">
        <template #body="{ data }">
          {{ data.coordinates.lat }}
        </template>
        <template #editor="{ data }">
          <InputNumber 
            v-model="data.coordinates.lat" 
            :min="-90" 
            :max="90"
            :maxFractionDigits="6"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="coordinates.lng" header="Longitude">
        <template #body="{ data }">
          {{ data.coordinates.lng }}
        </template>
        <template #editor="{ data }">
          <InputNumber 
            v-model="data.coordinates.lng" 
            :min="-180" 
            :max="180"
            :maxFractionDigits="6"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="timezone" header="Timezone (UTC)">
        <template #body="{ data }">
          UTC{{ data.timezone >= 0 ? '+' : '' }}{{ data.timezone }}
        </template>
        <template #editor="{ data }">
          <Dropdown 
            v-model="data.timezone" 
            :options="timezoneOptions"
            optionLabel="label"
            optionValue="value"
            autofocus
          />
        </template>
      </Column>
      
      <Column header="Actions" style="width: 100px">
        <template #body="{ data }">
          <Button 
            icon="pi pi-trash" 
            severity="danger"
            text
            rounded
            @click="confirmDelete(data.name)"
            size="small"
          />
        </template>
      </Column>
    </DataTable>
    
    <Dialog 
      v-model:visible="deleteDialogVisible" 
      header="Confirm Delete" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>Are you sure you want to delete location "{{ locationToDelete }}"?</p>
      <template #footer>
        <Button 
          label="Cancel" 
          @click="deleteDialogVisible = false"
          text
        />
        <Button 
          label="Delete" 
          severity="danger"
          @click="executeDelete"
        />
      </template>
    </Dialog>
    
    <Message v-if="error" severity="error" :closable="true" @close="error = null">
      {{ error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppState } from '../composables/useAppState'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

const { locations, addLocation, updateLocation, deleteLocation, error } = useAppState()

const deleteDialogVisible = ref(false)
const locationToDelete = ref('')

// Generate timezone options from -12 to +12
const timezoneOptions = Array.from({ length: 25 }, (_, i) => ({
  label: `UTC${i - 12 >= 0 ? '+' : ''}${i - 12}`,
  value: i - 12
}))

// Convert locations object to array for DataTable
const tableData = computed(() => 
  Object.values(locations.value).map(loc => ({
    ...loc,
    originalName: loc.name // Keep track of original name for updates
  }))
)

const addNewLocation = () => {
  const newName = `Location ${Object.keys(locations.value).length + 1}`
  addLocation({
    name: newName,
    coordinates: { lat: 0, lng: 0 },
    timezone: 0
  })
}

const onCellEditComplete = (event: any) => {
  const { data, field } = event
  
  // Validate coordinates
  if (field === 'coordinates.lat' && (data.coordinates.lat < -90 || data.coordinates.lat > 90)) {
    error.value = 'Latitude must be between -90 and 90'
    return
  }
  
  if (field === 'coordinates.lng' && (data.coordinates.lng < -180 || data.coordinates.lng > 180)) {
    error.value = 'Longitude must be between -180 and 180'
    return
  }
  
  // Update location
  updateLocation(data.originalName || data.name, {
    name: data.name,
    coordinates: data.coordinates,
    timezone: data.timezone
  })
  
  // Update original name if name was changed
  if (field === 'name') {
    data.originalName = data.name
  }
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
</style> 