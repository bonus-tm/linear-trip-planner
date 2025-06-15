<script setup lang="ts">
import LocationsTable from './components/LocationsTable.vue';
import StepsTable from './components/StepsTable.vue';
import Timeline from './components/Timeline.vue';
</script>

<template>
  <div class="app-container">
    <h1>Travel Itinerary Planner</h1>

    <Timeline/>
    <StepsTable/>
    <LocationsTable/>
  </div>
</template>

<style scoped>
.app-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h1 {
  margin: 0;
  text-align: center;
  transition: color 0.3s ease;
}
</style>
