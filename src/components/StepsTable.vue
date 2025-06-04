<template>
  <div class="steps-table">
    <div class="table-header">
      <h2>Steps</h2>
      <Button 
        icon="pi pi-plus" 
        label="Add Step" 
        @click="addNewStep"
        size="small"
      />
    </div>
    
    <DataTable 
      :value="sortedSteps" 
      editMode="cell"
      @cell-edit-complete="onCellEditComplete"
      responsiveLayout="scroll"
      size="small"
      :rowClass="getRowClass"
    >
      <Column field="type" header="Type" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.type" :severity="data.type === 'move' ? 'info' : 'success'" />
        </template>
        <template #editor="{ data }">
          <Dropdown 
            v-model="data.type" 
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="startDate" header="Start Date/Time">
        <template #body="{ data }">
          {{ formatDate(data.startDate) }}
        </template>
        <template #editor="{ data }">
          <InputText 
            v-model="data.startDate" 
            type="datetime-local"
            :step="data.type === 'move' ? 60 : undefined"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="finishDate" header="Finish Date/Time">
        <template #body="{ data }">
          {{ formatDate(data.finishDate) }}
        </template>
        <template #editor="{ data }">
          <InputText 
            v-model="data.finishDate" 
            type="datetime-local"
            :min="data.startDate"
            :step="data.type === 'move' ? 60 : undefined"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="startLocation" header="Start Location">
        <template #editor="{ data }">
          <Dropdown 
            v-model="data.startLocation" 
            :options="locationNames"
            placeholder="Select location"
            autofocus
          />
        </template>
      </Column>
      
      <Column field="finishLocation" header="Finish Location">
        <template #body="{ data }">
          {{ data.type === 'move' ? data.finishLocation : '-' }}
        </template>
        <template #editor="{ data }">
          <Dropdown 
            v-if="data.type === 'move'"
            v-model="data.finishLocation" 
            :options="locationNames"
            placeholder="Select location"
            autofocus
          />
          <span v-else>-</span>
        </template>
      </Column>
      
      <Column field="startAirport" header="From Airport">
        <template #body="{ data }">
          {{ data.type === 'move' ? (data.startAirport || '-') : '-' }}
        </template>
        <template #editor="{ data }">
          <InputText 
            v-if="data.type === 'move'"
            v-model="data.startAirport" 
            placeholder="XXX"
            :maxlength="3"
            style="text-transform: uppercase"
            autofocus
          />
          <span v-else>-</span>
        </template>
      </Column>
      
      <Column field="finishAirport" header="To Airport">
        <template #body="{ data }">
          {{ data.type === 'move' ? (data.finishAirport || '-') : '-' }}
        </template>
        <template #editor="{ data }">
          <InputText 
            v-if="data.type === 'move'"
            v-model="data.finishAirport" 
            placeholder="XXX"
            :maxlength="3"
            style="text-transform: uppercase"
            autofocus
          />
          <span v-else>-</span>
        </template>
      </Column>
      
      <Column field="description" header="Description">
        <template #editor="{ data }">
          <InputText 
            v-model="data.description" 
            placeholder="Optional description"
            autofocus
          />
        </template>
      </Column>
      
      <Column header="Actions" style="width: 80px">
        <template #body="{ data }">
          <Button 
            icon="pi pi-trash" 
            severity="danger"
            text
            rounded
            @click="confirmDelete(data.id)"
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
      <p>Are you sure you want to delete this step?</p>
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
import { ref } from 'vue'
import { useAppState } from '../composables/useAppState'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import type { Step } from '../types'

const { sortedSteps, locationNames, addStep, updateStep, deleteStep, error } = useAppState()

const deleteDialogVisible = ref(false)
const stepToDelete = ref('')

const typeOptions = [
  { label: 'Move', value: 'move' },
  { label: 'Stay', value: 'stay' }
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  
  // Check if it's a date-only format (no time component)
  if (dateStr.length === 10 || !dateStr.includes('T')) {
    return date.toLocaleDateString()
  }
  
  return date.toLocaleString()
}

const getRowClass = (data: Step) => {
  return data.type === 'move' ? 'move-row' : 'stay-row'
}

const addNewStep = () => {
  const lastStep = sortedSteps.value[sortedSteps.value.length - 1]
  
  // Prefill values based on requirements
  const newStep: Omit<Step, 'id'> = {
    type: 'stay',
    startDate: lastStep ? lastStep.finishDate : new Date().toISOString().slice(0, 16),
    finishDate: lastStep ? lastStep.finishDate : new Date().toISOString().slice(0, 16),
    startLocation: lastStep ? (lastStep.type === 'move' ? lastStep.finishLocation! : lastStep.startLocation) : (locationNames.value[0] || ''),
    description: ''
  }
  
  addStep(newStep)
}

const onCellEditComplete = (event: any) => {
  const { data, field } = event
  
  // Validation
  if (field === 'startDate' || field === 'finishDate') {
    const start = new Date(data.startDate)
    const finish = new Date(data.finishDate)
    
    if (finish < start) {
      error.value = 'Finish date cannot be earlier than start date'
      // Revert the change
      if (field === 'finishDate') {
        data.finishDate = data.startDate
      }
      return
    }
  }
  
  // Clean up fields when changing type
  if (field === 'type') {
    if (data.type === 'stay') {
      delete data.finishLocation
      delete data.startAirport
      delete data.finishAirport
    }
  }
  
  // Convert airport codes to uppercase
  if (field === 'startAirport' || field === 'finishAirport') {
    data[field] = data[field]?.toUpperCase()
  }
  
  // Update step
  updateStep(data.id, data)
}

const confirmDelete = (id: string) => {
  stepToDelete.value = id
  deleteDialogVisible.value = true
}

const executeDelete = () => {
  deleteStep(stepToDelete.value)
  deleteDialogVisible.value = false
  stepToDelete.value = ''
}
</script>

<style scoped>
.steps-table {
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

:deep(.move-row) {
  background-color: rgba(59, 130, 246, 0.05);
}

:deep(.stay-row) {
  background-color: rgba(34, 197, 94, 0.05);
}
</style> 