<script lang="ts" setup>
import type {DayBlock} from '../types';

defineProps<{ day: DayBlock }>();
</script>

<template>
  <div :class="{empty: day.isEmpty}" :style="day.style" class="day-block">
    <div v-if="!day.isEmpty" :style="day.daylightStyle" class="daylight-bar" />
    <div
      v-if="day.daylight?.polar_night && !day.isEmpty"
      class="polar-night-indicator"
    >
      ❄️
    </div>
    <div class="date-label">
      {{ day.label }}
    </div>
  </div>
</template>

<style scoped>
.day-block {
  box-sizing: content-box;
  position: absolute;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  z-index: 2;

  &.empty {
    background-color: var(--color-surface);
    border: 1px dashed var(--color-border);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
}

.daylight-bar {
  position: absolute;
  background-color: var(--color-daylight);
  opacity: 0.8;
  transition: background-color 0.3s ease;
  z-index: 3;
}

.polar-night-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  z-index: 4;
}

.date-label {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 100%);
  white-space: nowrap;
  text-align: center;
  font-size: 0.625rem;
  font-weight: 400;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  z-index: 1;
}

</style>