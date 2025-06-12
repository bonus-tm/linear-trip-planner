<script lang="ts" setup>
import type {MoveBlock} from '../types';

defineProps<{ move: MoveBlock }>();
</script>

<template>
  <div :style="move.style" class="timeline-move-rectangle"/>
  <div :style="move.labels.beginTime.style" class="time-label begin-time">
    {{ move.labels.beginTime.text }}
  </div>
  <div :style="move.labels.endTime.style" class="time-label end-time">
    {{ move.labels.endTime.text }}
  </div>
  <div :style="move.labels.duration.style" class="time-label duration-time">
    {{ move.labels.duration.text }}
  </div>
</template>

<style scoped>
.timeline-move-rectangle {
  position: absolute;
  background-color: var(--color-move-rectangle);
  border: thin solid var(--color-move-rectangle-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  z-index: 10;
  cursor: pointer;
}

.move-rectangle:hover {
  background-color: var(--color-move-rectangle-hover);
  z-index: 6;
}

.time-label {
  position: absolute;
  color: var(--color-text);
  font-size: 0.75rem;
  line-height: 1.1;
  font-weight: 500;
  padding-inline: 0.125em;
  background-color: var(--color-surface);
  border: thin solid var(--color-border-light);
  border-radius: 2px;
  white-space: nowrap;
  z-index: 17;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.begin-time {
  transform: translate(-100%, -50%);
}

.end-time {
  transform: translate(0, -50%);
}

.duration-time {
  transform: translate(-50%, -100%);
  padding-inline: 0.125em;
  background-color: var(--color-move-duration-bg);
  border: none;
  font-size: 0.625rem;
  letter-spacing: -0.08em;
}
</style>