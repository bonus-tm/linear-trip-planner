<script lang="ts" setup>
import {useAppState} from '../../composables/useAppState.ts';
import type {Trip} from '../../types';
import {convertYMRangeToMonths} from '../../utils/datetime.ts';

const {allTripsWithUnsaved, currentTripId, switchToTrip, isLoading} = useAppState();

const handleTripClick = async (tripId: string) => {
  if (isLoading.value || tripId === currentTripId.value) {
    return;
  }

  try {
    await switchToTrip(tripId);
  } catch (error) {
    console.error('Failed to switch to trip:', error);
  }
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
};

const getTripTitle = (trip: Trip & { id: string }): string => {
  return trip.places.join('&thinsp;—&thinsp;') || 'New Trip';
};

const getTripSubtitle = (trip: Trip & { id: string }): string => {
  if (trip.duration && trip.month) {
    const months = convertYMRangeToMonths(trip.month, {dash: '–', space: '&thinsp;'});
    return `${trip.duration} ${trip.duration > 1 ? 'days' : 'day'} in ${months}`;
  }
  return '';
};
</script>

<template>
  <div class="trips-list">
    <div v-if="isLoading" class="loading">
      Loading trips...
    </div>

    <div v-else-if="allTripsWithUnsaved.length === 0" class="empty-state">
      No trips yet
    </div>

    <div v-else class="trips">
      <div
        v-for="trip in allTripsWithUnsaved"
        :key="trip.id"
        class="trip-item"
        :class="{ 'current': trip.id === currentTripId }"
        @click="handleTripClick(trip.id)"
      >
        <div class="trip-content">
          <h4 class="trip-title" v-html="getTripTitle(trip)"></h4>
          <p v-if="getTripSubtitle(trip)" class="trip-subtitle" v-html="getTripSubtitle(trip)"></p>
          <div class="trip-meta">
            <span class="trip-date">{{ formatDate(trip.updated_at) }}</span>
            <span class="trip-time">{{ formatTime(trip.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading, .empty-state {
  padding: 1rem 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
}

.trips {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.trip-item {
  position: relative;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-item:hover {
  border-color: var(--color-move-rectangle-border);
  background: var(--color-hover);
}

.trip-item.current {
  border-color: var(--color-move-rectangle-border);
  background: var(--color-move-row);
}

.trip-content {
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.trip-title {
  margin: 0 0 0.125rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-subtitle {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.625rem;
  color: var(--color-text-muted);
}
</style>