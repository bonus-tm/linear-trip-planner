<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useAppState} from '../../composables/useAppState.ts';
import Button from 'primevue/button';
import type {Step, StepType} from '../../types';
import {formatISOWithTZ} from '../../utils/datetime.ts';
import MoveCard from './MoveCard.vue';
import MoveEditModal from './MoveEditModal.vue';
import StayCard from './StayCard.vue';
import StayEditModal from './StayEditModal.vue';

const {sortedSteps, locationsList, locations, addStep, updateStep, deleteStep, isLoading} = useAppState();

// Modal state
const editModalVisible = ref(false);
const editingStep = ref<Step | null>(null);
const isCreatingNewStep = ref(false);

// Convert steps to cards data with computed properties for editing
const cardsData = computed(() =>
  sortedSteps.value.map(step => ({
    ...step,
  })),
);

const addNewStep = (type: StepType) => {
  const lastStep = sortedSteps.value[sortedSteps.value.length - 1];

  // Determine the location for the new step
  let newLocationId: string;
  if (lastStep) {
    // Use the finish location of the last step if it's a move, otherwise use the start location
    newLocationId = lastStep.type === 'move' ? lastStep.finishLocationId! : lastStep.startLocationId;
  } else {
    // Use the first available location
    newLocationId = locationsList.value[0]?.id || '';
  }

  // Get the current time in the new step's location timezone
  let defaultDateTime: string;
  let defaultTimestamp: number;
  if (lastStep) {
    // Use the last step's finish date/time as starting point
    defaultDateTime = lastStep.finishDate;
    defaultTimestamp = lastStep.finishTimestamp;
  } else {
    // Create new datetime in the target location's timezone
    const locationTimezone = locations.value[newLocationId]?.timezone || 0;
    defaultTimestamp = Date.now();
    defaultDateTime = formatISOWithTZ(defaultTimestamp, locationTimezone);
  }

  // Create a draft step without adding it to the list
  const draftStep: Step = {
    id: '', // Temporary ID, will be generated when saved
    type,
    startDate: defaultDateTime,
    finishDate: defaultDateTime,
    startTimestamp: defaultTimestamp,
    finishTimestamp: defaultTimestamp,
    startLocationId: newLocationId,
    description: '',
    ...(type === 'move' && { finishLocationId: newLocationId }),
  };

  // Set up modal for creating new step
  editingStep.value = draftStep;
  isCreatingNewStep.value = true;
  editModalVisible.value = true;
};

const handleEditStep = (stepId: string) => {
  const step = sortedSteps.value.find(s => s.id === stepId);
  if (step) {
    editingStep.value = step;
    isCreatingNewStep.value = false;
    editModalVisible.value = true;
  }
};

const handleSaveStep = async (stepData: Partial<Step>) => {
  if (isCreatingNewStep.value) {
    // Create new step - cast to the required type since we know it has all required fields
    const success = await addStep(stepData as Omit<Step, 'id'>);
    if (success) {
      editingStep.value = null;
      isCreatingNewStep.value = false;
      editModalVisible.value = false;
    }
  } else if (editingStep.value?.id) {
    // Update existing step
    const success = await updateStep(editingStep.value.id, stepData);
    if (success) {
      editingStep.value = null;
      isCreatingNewStep.value = false;
      editModalVisible.value = false;
    }
  }
};

const handleDeleteStep = async (stepId: string) => {
  if (!isCreatingNewStep.value) {
    const success = await deleteStep(stepId);
    if (success) {
      editingStep.value = null;
      isCreatingNewStep.value = false;
      editModalVisible.value = false;
    }
  } else {
    // Just close modal for new step creation
    editingStep.value = null;
    isCreatingNewStep.value = false;
    editModalVisible.value = false;
  }
};

const handleModalClose = () => {
  editingStep.value = null;
  isCreatingNewStep.value = false;
};
</script>

<template>
  <div class="steps-cards">
    <div class="cards-header">
      <h2>Steps</h2>
      <Button
        icon="pi pi-arrow-right"
        label="Add Move"
        severity="info"
        size="small"
        :loading="isLoading"
        @click="addNewStep('move')"
      />
      <Button
        icon="pi pi-building"
        label="Add Stay"
        severity="success"
        size="small"
        :loading="isLoading"
        @click="addNewStep('stay')"
      />
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Loading steps...</p>
    </div>

    <div v-else class="cards-container">
      <template
        v-for="step in cardsData"
        :key="step.id"
      >
        <MoveCard
          v-if="step.type === 'move'"
          :step="step"
          :step-number="sortedSteps.findIndex(s => s.id === step.id) + 1"
          @edit="handleEditStep"
        />
        <StayCard
          v-if="step.type === 'stay'"
          :step="step"
          :step-number="sortedSteps.findIndex(s => s.id === step.id) + 1"
          @edit="handleEditStep"
        />
      </template>
    </div>

    <!-- Edit Modals -->
    <StayEditModal
      v-if="editingStep && editingStep.type === 'stay'"
      v-model:visible="editModalVisible"
      :step="editingStep"
      :is-creating="isCreatingNewStep"
      @delete="handleDeleteStep"
      @save="handleSaveStep"
      @close="handleModalClose"
    />

    <MoveEditModal
      v-if="editingStep && editingStep.type === 'move'"
      v-model:visible="editModalVisible"
      :step="editingStep"
      :is-creating="isCreatingNewStep"
      @delete="handleDeleteStep"
      @save="handleSaveStep"
      @close="handleModalClose"
    />
  </div>
</template>

<style scoped>
.steps-cards {
  margin-block: 2rem;
  padding-inline: 1rem;
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
</style> 