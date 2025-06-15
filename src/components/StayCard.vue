<script lang="ts" setup>
import {computed} from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import type {Step} from '../types';
import {useAppState} from '../composables/useAppState';
import {capitalize} from '../utils/text';
import {formatDurationDays, formatHumanDate, formatTZ} from '../utils/datetime';

interface Props {
  step: Step;
  stepNumber: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [stepId: string];
}>();

const {locations} = useAppState();

const startLocation = computed(() => locations.value[props.step.startLocation]);

const duration = computed(() => {
  return formatDurationDays(props.step.startDate, props.step.finishDate);
});
</script>

<template>
  <Card class="step-card stay-card">
    <template #title>
      <div class="card-title">
        <span class="step-number">
          <span class="hashbang">#</span>{{ stepNumber }}
        </span>
        <Tag :value="capitalize(step.type)" severity="success"/>
        <div class="step-duration">{{ duration }}</div>

        <div class="edit-button-container">
          <Button
            icon="pi pi-pencil"
            rounded
            severity="info"
            size="small"
            text
            @click="emit('edit', step.id)"
          />
        </div>
      </div>
    </template>

    <template #content>
      <div class="card-content">
        <div class="stay-location">
          {{ step.startLocation }}
          <div v-if="startLocation" class="timezone-info">
            GMT{{ formatTZ(startLocation.timezone) }}
          </div>
        </div>

        <div class="dates">
          {{ formatHumanDate(step.startDate) }}&thinsp;–&thinsp;{{ formatHumanDate(step.finishDate) }}
        </div>

        <div v-if="step.description" class="step-description">
          {{ step.description }}
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.stay-card {
  background-color: var(--color-stay-row);
  transition: background-color 0.3s ease;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.edit-button-container {
  margin-inline-start: auto;
}

.step-number {
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.7;
}

.step-number .hashbang {
  font-weight: 400;
  opacity: 0.5;
}

.step-duration {
  font-size: 0.875rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stay-location {
  font-size: 1rem;
  font-weight: 600;
}

.timezone-info {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.6;
}

.dates {

}

.step-description {
  font-style: italic;
  opacity: 0.8;
  white-space: preserve-breaks;
}
</style> 