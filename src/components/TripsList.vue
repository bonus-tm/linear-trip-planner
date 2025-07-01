<script lang="ts" setup>
import {useAppState} from '../composables/useAppState';
import type {Trip} from '../types';

const {allTrips, currentTripId, switchToTrip, isLoading} = useAppState();

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
  return trip.places || 'Trip';
};

const getTripSubtitle = (trip: Trip & { id: string }): string => {
  if (trip.duration && trip.month) {
    return `${trip.duration} in ${trip.month}`;
  }
  return '';
};
</script>

<template>
  <div class="trips-list">
    <h3 class="trips-title">Trips</h3>

    <div v-if="isLoading" class="loading">
      Loading trips...
    </div>

    <div v-else-if="allTrips.length === 0" class="empty-state">
      No trips yet
    </div>

    <ul v-else class="trips">
      <li
        v-for="trip in allTrips"
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
        <div v-if="trip.id === currentTripId" class="current-indicator">
          ●
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.trips-list {
  width: 100%;
}

.trips-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.loading, .empty-state {
  padding: 1rem 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
}

.trips {
  list-style: none;
  padding: 0;
  margin: 0;
}

.trip-item {
  position: relative;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-item:hover {
  border-color: var(--color-move-rectangle-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-subtitle {
  margin: 0 0 0.5rem 0;
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

.current-indicator {
  color: var(--color-move-rectangle-border);
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* Make the trips list scrollable if it gets too long */
.trips {
  max-height: 60vh;
  overflow-y: auto;
}

.trips::-webkit-scrollbar {
  width: 4px;
}

.trips::-webkit-scrollbar-track {
  background: transparent;
}

.trips::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

.trips::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style> 