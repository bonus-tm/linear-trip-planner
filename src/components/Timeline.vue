<script lang="ts" setup>
import {useAppState} from '../composables/useAppState';
import {useTimelineLayout} from '../composables/useTimelineLayout';
import TimelineLocation from './TimelineLocation.vue';
import MoveBlock from './MoveBlock.vue';

const {locations, steps} = useAppState();
const {layout} = useTimelineLayout(locations, steps);
</script>

<template>
  <div class="timeline-container">
    <p v-if="layout.width === 0" class="no-data-message">
      Add locations and steps to see your travel timeline
    </p>
    <div
      v-if="(layout.width ?? 0) > 0"
      ref="containerRef"
      class="timeline-wrapper"
    >
      <div
        :style="{
            width: `${layout.width}px`,
            height: `${layout.height}px`
          }"
        class="timeline-canvas"
      >
        <TimelineLocation
          v-for="location in layout.locations"
          :key="location.name"
          :location="location"
        />
        <MoveBlock
          v-for="move in layout.moves"
          :key="move.stepId"
          :move="move"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-data-message {
  margin: 0;
  padding: 1rem;
  color: var(--color-secondary);
  font-style: italic;
  transition: color 0.3s ease;
}

.timeline-container {
  background-color: var(--color-surface)
}

.timeline-wrapper {
  position: relative;
  overflow-x: auto;
}

.timeline-canvas {
  position: relative;
  min-width: fit-content;
}
</style> 