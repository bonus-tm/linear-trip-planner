<script lang="ts" setup>
import type {TimelineLocation} from '../types';
import DayBlock from './DayBlock.vue';
import {formatTZ} from '../utils/datetime.ts';

defineProps<{ location: TimelineLocation }>();
</script>

<template>
  <div :style="location.label.style" class="location-name">
    {{ location.label.text }}
    <div class="timezone">
      GMT{{ formatTZ(location.timezone) }}
    </div>
  </div>
  <div :style="{top: location.top}" class="timeline-location">
    <DayBlock v-for="day in location.days" :key="day.id" :day="day"/>
  </div>
</template>

<style scoped>
.timeline-location {
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 1;
}

.location-name {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  transition: color 0.3s ease;
  font-weight: 500;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.1;
  z-index: 1;

  .timezone {
    font-size: 0.625rem;
    font-weight: 400;
    color: var(--color-secondary);
    line-height: 1;
    transition: color 0.3s ease;
  }
}
</style>