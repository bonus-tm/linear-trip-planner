<script lang="ts" setup>
import {ref} from 'vue'
import {useAppState} from '../composables/useAppState'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import type {Step} from '../types'

const {sortedSteps, locationNames, addStep, updateStep, deleteStep, error} = useAppState()

const deleteDialogVisible = ref(false)
const stepToDelete = ref('')

const typeOptions = [
  {label: 'Move', value: 'move'},
  {label: 'Stay', value: 'stay'}
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
  const {newData: data, field} = event

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

<template>
  <div class="steps-table">
    <div class="table-header">
      <h2>Steps</h2>
      <Button
          icon="pi pi-plus"
          label="Add Step"
          size="small"
          @click="addNewStep"
      />
    </div>

    <DataTable
        :rowClass="getRowClass"
        :value="sortedSteps"
        editMode="cell"
        responsiveLayout="scroll"
        size="small"
        @cell-edit-complete="onCellEditComplete"
    >
      <Column field="type" header="Type" style="width: 100px">
        <template #body="{ data }">
          <Tag :severity="data.type === 'move' ? 'info' : 'success'" :value="data.type"/>
        </template>
        <template #editor="{ data }">
          <Select
              v-model="data.type"
              :options="typeOptions"
              autofocus
              optionLabel="label"
              optionValue="value"
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
              :step="data.type === 'move' ? 60 : undefined"
              autofocus
              type="datetime-local"
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
              :min="data.startDate"
              :step="data.type === 'move' ? 60 : undefined"
              autofocus
              type="datetime-local"
          />
        </template>
      </Column>

      <Column field="startLocation" header="Start Location">
        <template #editor="{ data }">
          <Select
              v-model="data.startLocation"
              :options="locationNames"
              autofocus
              placeholder="Select location"
          />
        </template>
      </Column>

      <Column field="finishLocation" header="Finish Location">
        <template #body="{ data }">
          {{ data.type === 'move' ? data.finishLocation : '-' }}
        </template>
        <template #editor="{ data }">
          <Select
              v-if="data.type === 'move'"
              v-model="data.finishLocation"
              :options="locationNames"
              autofocus
              placeholder="Select location"
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
              :maxlength="3"
              autofocus
              placeholder="XXX"
              style="text-transform: uppercase"
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
              :maxlength="3"
              autofocus
              placeholder="XXX"
              style="text-transform: uppercase"
          />
          <span v-else>-</span>
        </template>
      </Column>

      <Column field="description" header="Description">
        <template #editor="{ data }">
          <InputText
              v-model="data.description"
              autofocus
              placeholder="Optional description"
          />
        </template>
      </Column>

      <Column header="Actions" style="width: 80px">
        <template #body="{ data }">
          <Button
              icon="pi pi-trash"
              rounded
              severity="danger"
              size="small"
              text
              @click="confirmDelete(data.id)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
        v-model:visible="deleteDialogVisible"
        :modal="true"
        :style="{ width: '400px' }"
        header="Confirm Delete"
    >
      <p>Are you sure you want to delete this step?</p>
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
  color: var(--color-text);
  transition: color 0.3s ease;
}

:deep(.move-row) {
  background-color: var(--color-move-row);
  transition: background-color 0.3s ease;
}

:deep(.stay-row) {
  background-color: var(--color-stay-row);
  transition: background-color 0.3s ease;
}
</style> 