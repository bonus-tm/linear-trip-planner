<script lang="ts" setup>
import type {TimelineLocation} from '../types';
import {formatTZ} from '../utils/datetime';
import DayBlock from './DayBlock.vue';

defineProps<{
  location: TimelineLocation;
  dayWidth: number;
}>();
</script>

<template>
  <div :style="location.label.style" class="location-name">
    {{ location.label.text }}
    <div class="timezone">
      GMT{{ formatTZ(location.timezone) }}
    </div>
  </div>
  <DayBlock
    v-for="day in location.days"
    :key="day.id"
    :day="day"
    :width="dayWidth"
  />
</template>

<style scoped>
.location-name {
  position: sticky;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  transition: color 0.3s ease;
  font-weight: 500;
  background-color: var(--color-label-bg);
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.1;
  z-index: 20;
  width: fit-content;
  padding: 0.3rem 1rem 0.3rem;

  .timezone {
    font-size: 0.625rem;
    font-weight: 400;
    color: var(--color-secondary);
    line-height: 1;
    transition: color 0.3s ease;
  }
}
</style>