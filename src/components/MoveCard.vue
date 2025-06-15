<script lang="ts" setup>
import {computed} from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import type {Step} from '../types';
import {useAppState} from '../composables/useAppState';
import {capitalize} from '../utils/text';
import {formatDurationTime, formatHumanDateTime} from '../utils/datetime';

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
const finishLocation = computed(() => locations.value[props.step.finishLocation || '']);

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getDuration = () => {
  const start = new Date(props.step.startDate);
  const finish = new Date(props.step.finishDate);
  const diffMs = finish.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};
const duration = computed(() => {
  return formatDurationTime(props.step.startTimestamp, props.step.finishTimestamp);
});
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
          {{ step.startLocation }}
        </div>
        <div class="step-start step-date">
          {{ formatHumanDateTime(step.startDate) }}
        </div>
        <div class="step-start airport">
          {{ step.startAirport }}
        </div>

        <div class="arrow">
          <span class="pi pi-arrow-right"/>
        </div>

        <div class="step-finish step-location">
          {{ step.finishLocation }}
        </div>
        <div class="step-finish step-date">
          {{ formatHumanDateTime(step.finishDate) }}
        </div>
        <div class="step-finish airport">
          {{ step.finishAirport }}
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
.step-start{
  grid-column-start: 1;
}
.step-finish{
  grid-column-start: 3;
}

.step-location {
  font-size: 1rem;
  font-weight: 600;
  grid-row: 1;
}
.step-date {
  grid-row: 2;
}

.airport {
  font-family: monospace;
  font-weight: 600;
  text-transform: uppercase;
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