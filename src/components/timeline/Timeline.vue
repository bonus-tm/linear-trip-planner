<script lang="ts" setup>
import {useTemplateRef} from 'vue';
import Button from 'primevue/button';
import ButtonGroup from 'primevue/buttongroup';
import {useAppState} from '../../composables/useAppState';
import {useTimelineLayout} from '../../composables/useTimelineLayout';
import TimelineLocation from './TimelineLocation.vue';
import MoveBlock from '../steps/MoveBlock.vue';

const timelineContainer = useTemplateRef('wrapper');

const {locations, sortedSteps} = useAppState();
const {layout, dayWidth, isFitZoom, isMaxZoom, isMinZoom, zoomIn, zoomOut, zoomToFit} = useTimelineLayout(
  locations,
  sortedSteps,
  timelineContainer,
);
</script>

<template>
  <div class="timeline-container">
    <p v-if="layout.width === 0" class="no-data-message">
      Add locations and steps to see your travel timeline
    </p>
    <template v-else>
      <div class="zoom-controls">
        <Button
          :severity="isFitZoom ? 'contrast' : 'secondary'"
          icon="pi pi-arrows-h"
          label="Fit"
          size="small"
          @click="zoomToFit"
        />
        <ButtonGroup>
          <Button
            :disabled="isMinZoom"
            icon="pi pi-search-minus"
            severity="secondary"
            size="small"
            @click="zoomOut"
          />
          <Button
            :disabled="isMaxZoom"
            icon="pi pi-search-plus"
            severity="secondary"
            size="small"
            @click="zoomIn"
          />
        </ButtonGroup>
      </div>
      <div ref="wrapper" class="timeline-wrapper">
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
            :dayWidth="dayWidth"
          />
          <MoveBlock
            v-for="move in layout.moves"
            :key="move.stepId"
            :move="move"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.no-data-message {
  margin: 0;
  padding: 1rem;
  color: var(--color-secondary);
  font-style: italic;
  text-align: center;
  transition: color 0.3s ease;
}

.timeline-container {
  position: relative;
  background-color: var(--color-surface);
  border-bottom: thin solid var(--color-border);

  .zoom-controls {
    position: absolute;
    top: -0.5rem;
    right: 1rem;
    transform: translateY(-100%);
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }
}

.timeline-wrapper {
  position: relative;
  overflow-x: auto;
  max-width: calc(100vw - var(--nav-width));
}

.timeline-canvas {
  position: relative;
}
</style> 