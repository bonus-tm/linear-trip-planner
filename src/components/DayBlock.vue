<script lang="ts" setup>
import {computed} from 'vue';
import type {DayBlock} from '../types';

const props = defineProps<{
  day: DayBlock;
  width: number;
}>();

const label = computed(() => {
  const options: Intl.DateTimeFormatOptions = {day: 'numeric'};
  if (props.width > 50) {
    options.month = 'short';
  }
  if (props.width > 70) {
    options.weekday = 'narrow';
  }
  if (props.width > 80) {
    options.weekday = 'short';
  }
  return new Date(props.day.date).toLocaleDateString('en', options);
});
</script>

<template>
  <div
    :class="{empty: day.isEmpty, weekend: day.isWeekend}"
    :style="day.style"
    class="day-block"
  >
    <div :style="day.daylightStyle" class="daylight-bar"/>
    <div
      v-if="day.daylight?.polar_night && !day.isEmpty"
      class="polar-night-indicator"
    >
      <span class="pi pi-moon"/>
    </div>
    <div class="hour-ticks">
      <div v-if="width > 48"/>
      <div v-if="width > 48"/>
      <div/>
      <div/>
    </div>
    <div class="date-label">{{ label }}</div>
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

    .daylight-bar {
      background-color: var(--color-daylight-on-empty-day);
    }
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

  & > .pi {
    font-size: 0.75rem;
    position: relative;
    top: -2px;
    color: var(--color-border);
  }
}

.hour-ticks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12px, 1fr));
  grid-template-rows: 1fr;
  height: 20%;
  width: calc(100% + 1px);
  position: absolute;
  bottom: 0;
  left: -1px;
  z-index: 5;

  div {
    border-left: thin solid var(--color-hour-tick);
  }

  .empty & {
    display: none;
  }
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

  .empty & {
    display: none;
  }

  .weekend & {
    color: var(--color-weekend);
  }
}
</style>