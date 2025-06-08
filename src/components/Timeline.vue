<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useAppState } from '../composables/useAppState'
import { useTimelineLayout } from '../composables/useTimelineLayout'
import Card from 'primevue/card'

const { locations, steps } = useAppState()
const { 
  containerRef, 
  layout, 
  getDaylightStyle, 
  getMoveRectangleStyle, 
  getCellDimensions,
  formatTime 
} = useTimelineLayout(locations, steps)

const gridRef = ref<HTMLElement>()
const cellDimensions = ref({ width: 120, height: 20 })

const updateDimensions = async () => {
  await nextTick()
  cellDimensions.value = getCellDimensions()
}

const handleResize = () => {
  updateDimensions()
}

onMounted(() => {
  updateDimensions()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Calculate time label positions for moves
const getTimeLabels = (move: any) => {
  const cellWidth = cellDimensions.value.width
  const cellHeight = cellDimensions.value.height
  const locationLabelWidth = 200
  const rowHeight = 20
  const gapHeight = 50
  const totalRowHeight = rowHeight + gapHeight
  
  const startX = locationLabelWidth + move.startDay * cellWidth + (move.startTime / 1440) * cellWidth
  const endX = locationLabelWidth + move.endDay * cellWidth + (move.endTime / 1440) * cellWidth
  
  // Position labels vertically centered on the move rectangle (between start and end locations)
  const startLocationY = move.startLocationIndex * totalRowHeight
  const endLocationY = move.endLocationIndex * totalRowHeight + rowHeight
  const rectangleCenterY = (startLocationY + endLocationY) / 2
  
  // Get the original local times for display
  const step = move.step
  const startDate = new Date(step.startDate)
  const endDate = new Date(step.finishDate)
  
  const startLocalTime = startDate.getHours() * 60 + startDate.getMinutes()
  const endLocalTime = endDate.getHours() * 60 + endDate.getMinutes()
  
  return {
    start: {
      left: `${startX - 10}px`,
      top: `${rectangleCenterY - 10}px`,
      time: formatTime(startLocalTime)
    },
    end: {
      left: `${endX + 10}px`,
      top: `${rectangleCenterY - 10}px`,
      time: formatTime(endLocalTime)
    }
  }
}
</script>

<template>
  <div class="timeline-container">
    <Card>
      <template #header>
        <div class="timeline-header">
          <h2>Travel Timeline</h2>
          <p v-if="layout.days.length === 0" class="no-data-message">
            Add locations and steps to see your travel timeline
          </p>
        </div>
      </template>

      <template #content>
        <div
          v-if="layout.days.length > 0"
          ref="containerRef"
          class="timeline-wrapper"
        >
          <div
            ref="gridRef"
            class="timeline-grid"
            :style="{
              gridTemplateColumns: `200px repeat(${layout.days.length}, ${cellDimensions.width}px)`,
              gridTemplateRows: `repeat(${layout.locations.length}, 70px) 40px`,
              gap: '0 1px'
            }"
          >
            <!-- Location Labels -->
            <div
              v-for="(locationName, index) in layout.locations"
              :key="`location-${locationName}`"
              class="location-label"
              :style="{ gridRow: index + 1, gridColumn: 1 }"
            >
              <span class="location-name">{{ locationName }}</span>
              <span class="timezone">
                UTC{{ locations[locationName].timezone >= 0 ? '+' : '' }}{{ locations[locationName].timezone }}
              </span>
            </div>

            <!-- Day Cells -->
            <template v-for="(locationRow, locationIndex) in layout.grid" :key="`row-${locationIndex}`">
              <div
                v-for="(cell, dayIndex) in locationRow"
                :key="`cell-${locationIndex}-${dayIndex}`"
                class="day-cell"
                :class="{
                  'has-stay': cell.hasStay,
                  'has-move': cell.hasMove && !cell.hasStay,
                  'is-empty': cell.isEmpty
                }"
                :style="{ 
                  gridRow: locationIndex + 1, 
                  gridColumn: dayIndex + 2 
                }"
              >
                <!-- Daylight Bar -->
                <div
                  v-if="cell.daylight && !cell.isEmpty"
                  class="daylight-bar"
                  :style="getDaylightStyle(cell.daylight)"
                />
                
                <!-- Polar Night Indicator -->
                <div
                  v-if="cell.daylight?.polar_night && !cell.isEmpty"
                  class="polar-night-indicator"
                >
                  ❄️
                </div>
              </div>
            </template>

            <!-- Date Labels -->
            <div
              v-for="(dayLabel, index) in layout.dayLabels"
              :key="`date-${index}`"
              class="date-label"
              :style="{ 
                gridRow: layout.locations.length + 1, 
                gridColumn: index + 2 
              }"
            >
              {{ dayLabel }}
            </div>
          </div>

          <!-- Move Rectangles Overlay -->
          <div class="moves-overlay">
            <template v-for="move in layout.moves" :key="move.id">
              <!-- Move Rectangle -->
              <div
                class="move-rectangle"
                :style="getMoveRectangleStyle(move, cellDimensions.width, cellDimensions.height)"
                :title="`${move.step.startLocation} → ${move.step.finishLocation}`"
              />
              
              <!-- Time Labels -->
              <div
                class="time-label start-time"
                :style="{
                  left: getTimeLabels(move).start.left,
                  top: getTimeLabels(move).start.top
                }"
              >
                {{ getTimeLabels(move).start.time }}
              </div>
              
              <div
                class="time-label end-time"
                :style="{
                  left: getTimeLabels(move).end.left,
                  top: getTimeLabels(move).end.top
                }"
              >
                {{ getTimeLabels(move).end.time }}
              </div>
            </template>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.timeline-container {
  margin-top: 2rem;
}

.timeline-header {
  padding: 1rem;
}

.timeline-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
  transition: color 0.3s ease;
}

.no-data-message {
  margin: 0;
  color: var(--color-secondary);
  font-style: italic;
  transition: color 0.3s ease;
}

.timeline-wrapper {
  position: relative;
  overflow-x: auto;
  min-height: 200px;
}

.timeline-grid {
  display: grid;
  position: relative;
  min-width: fit-content;
}

.location-label {
  background-color: var(--color-surface);
  padding: 0.125rem 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-right: 2px solid var(--color-border);
  height: 20px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.location-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.75rem;
  line-height: 1;
  transition: color 0.3s ease;
}

.timezone {
  font-size: 0.625rem;
  color: var(--color-secondary);
  line-height: 1;
  transition: color 0.3s ease;
}

.day-cell {
  background-color: var(--color-surface);
  position: relative;
  height: 20px;
  transition: background-color 0.3s ease;
}

.day-cell.is-empty {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.day-cell.has-stay {
  background-color: var(--color-stay-row);
}

.day-cell.has-move {
  background-color: var(--color-move-row);
}

.daylight-bar {
  position: absolute;
  top: 0;
  background-color: var(--color-daylight);
  border-radius: 2px;
  opacity: 0.8;
  transition: background-color 0.3s ease;
}

.polar-night-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
}

.date-label {
  background-color: var(--color-surface);
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
  border-top: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.moves-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.move-rectangle {
  position: absolute;
  background-color: var(--color-move-rectangle);
  border: 1px solid var(--color-move-rectangle-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  z-index: 1;
}

.move-rectangle:hover {
  background-color: var(--color-move-rectangle-hover);
  z-index: 2;
}

.time-label {
  position: absolute;
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.25rem;
  white-space: nowrap;
  z-index: 3;
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.start-time {
  transform: translateX(-100%);
}

.end-time {
  transform: translateX(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .timeline-grid {
    font-size: 0.75rem;
  }
  
  .location-label {
    padding: 0.25rem;
    min-width: 120px;
  }
  
  .location-name {
    font-size: 0.75rem;
  }
  
  .timezone {
    font-size: 0.65rem;
  }
  
  .date-label {
    font-size: 0.65rem;
    padding: 0.25rem;
  }
  
  .time-label {
    font-size: 0.65rem;
    padding: 0.1rem 0.2rem;
  }
}

@media (max-width: 480px) {
  .timeline-wrapper {
    overflow-x: scroll;
  }
  
  .location-label {
    min-width: 100px;
  }
}
</style> 