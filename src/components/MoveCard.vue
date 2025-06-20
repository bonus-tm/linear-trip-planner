<script lang="ts" setup>
import {computed} from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import type {Step} from '../types';
import {useAppState} from '../composables/useAppState';
import {capitalize} from '../utils/text';
import {formatDurationTime} from '../utils/datetime';
import MoveDateTime from './MoveDateTime.vue';

interface Props {
  step: Step;
  stepNumber: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [stepId: string];
}>();

const {locations} = useAppState();

const startLocation = computed(() => locations.value[props.step.startLocationId]);
const finishLocation = computed(() => locations.value[props.step.finishLocationId!]);

const duration = computed(() => {
  return formatDurationTime(props.step.startTimestamp, props.step.finishTimestamp);
});
const sameDay = computed(() => {
  const start = new Date(props.step.startDate);
  const finish = new Date(props.step.finishDate);
  const sameYear = start.getFullYear() === finish.getFullYear();
  const sameMonth = start.getMonth() === finish.getMonth();
  const sameDay = start.getDate() === finish.getDate();
  return sameYear && sameMonth && sameDay;
})
</script>

<template>
  <Card class="step-card move-card">
    <template #title>
      <div class="card-title">
        <span class="step-number">
          <span class="hashbang">#</span>{{ stepNumber }}
        </span>
        <Tag severity="info" :value="capitalize(step.type)"/>
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
        <div class="step-start step-location">
          {{ startLocation?.name || 'Unknown Location' }}
        </div>
        <div class="step-start airport">
          {{ step.startAirport }}
        </div>
        <div class="step-start step-date">
          <MoveDateTime :date="step.startDate" showDate />
        </div>

        <div class="arrow">
          <span class="pi pi-arrow-right"/>
        </div>

        <div class="step-finish step-location">
          {{ finishLocation?.name || 'Unknown Location' }}
        </div>
        <div class="step-finish airport">
          {{ step.finishAirport }}
        </div>
        <div class="step-finish step-date">
          <MoveDateTime :date="step.finishDate" :showDate="!sameDay" />
        </div>

        <div v-if="step.description" class="step-description">
          {{ step.description }}
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.move-card {
  background-color: var(--color-move-row);
  transition: background-color 0.3s ease;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 1rem;

  .step-number {
    font-weight: 600;
    color: var(--color-text);
    opacity: 0.7;

    .hashbang {
      font-weight: 400;
      opacity: 0.5;
    }
  }

  .step-duration {
    font-size: 0.875rem;
  }

  .edit-button-container {
    margin-inline-start: auto;
  }
}

.card-content {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  gap: 0 0.5rem;
}

.step-start {
  grid-column-start: 1;
}

.step-finish {
  grid-column-start: 3;
}

.step-location {
  font-size: 1rem;
  font-weight: 600;
  grid-row: 1;
}

.airport {
  font-family: monospace;
  font-weight: 400;
  text-transform: uppercase;
  grid-row: 2;
  opacity: 0.8;
}

.step-date {
  grid-row: 3;
}

.arrow {
  grid-area: 1/2/4/3;
  padding-block-start: 0.25em;
}

.step-description {
  grid-column: 1 / span 3;
  font-style: italic;
  opacity: 0.8;
  margin-block-start: 0.5rem;
  white-space: preserve-breaks;
}
</style> 